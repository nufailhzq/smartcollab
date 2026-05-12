import { prisma } from "@/lib/prisma";
import type { Prisma, SubmissionStatus } from "@prisma/client";

export async function getTaughtCourses(lecturerId: number) {
  return prisma.course.findMany({
    where: { lecturerId },
    include: {
      _count: { select: { enrollments: true, assignments: true, groups: true, content: true } },
    },
    orderBy: { code: "asc" },
  });
}

export async function getTaughtCourseByCode(lecturerId: number, code: string) {
  return prisma.course.findFirst({
    where: { code, lecturerId },
    include: {
      content: {
        include: { postedBy: { select: { id: true, name: true } } },
        orderBy: { postedAt: "desc" },
      },
      assignments: {
        orderBy: { dueDate: "asc" },
        include: {
          _count: { select: { submissions: true } },
          submissions: {
            select: { id: true, status: true, grade: true },
          },
        },
      },
      groups: {
        include: {
          _count: { select: { members: true } },
          members: {
            include: { student: { select: { id: true, name: true, matricNum: true } } },
          },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function getLecturerSubmissions(
  lecturerId: number,
  filters: {
    courseId?: number;
    assignmentId?: number;
    status?: SubmissionStatus | "ALL";
  } = {},
) {
  const where: Prisma.SubmissionWhereInput = {
    assignment: {
      course: { lecturerId },
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
    },
    ...(filters.assignmentId ? { assignmentId: filters.assignmentId } : {}),
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
  };

  return prisma.submission.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, matricNum: true } },
      assignment: {
        select: {
          id: true,
          title: true,
          type: true,
          maxGrade: true,
          dueDate: true,
          course: { select: { id: true, code: true, title: true } },
        },
      },
      feedback: {
        include: { lecturer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
  });
}

export async function getCourseGroups(lecturerId: number, courseId: number) {
  // Verify ownership
  const course = await prisma.course.findFirst({
    where: { id: courseId, lecturerId },
    select: { id: true, code: true, title: true },
  });
  if (!course) return null;

  const groups = await prisma.projectGroup.findMany({
    where: { courseId },
    include: {
      members: {
        include: { student: { select: { id: true, name: true, matricNum: true } } },
        orderBy: { role: "asc" },
      },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  // Students enrolled in this course
  const enrollments = await prisma.classEnrollment.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, matricNum: true } } },
    orderBy: { student: { name: "asc" } },
  });

  // Map student → groupId for quick lookup of "ungrouped"
  const groupedStudentIds = new Set<number>();
  for (const g of groups) for (const m of g.members) groupedStudentIds.add(m.studentId);

  const ungroupedStudents = enrollments
    .filter((e) => !groupedStudentIds.has(e.studentId))
    .map((e) => e.student);

  return { course, groups, ungroupedStudents };
}

export type MonitoringRow = {
  studentId: number;
  studentName: string;
  matricNum: string | null;
  groupName: string | null;
  totalAssignments: number;
  submitted: number;
  graded: number;
  late: number;
  missing: number;
  averageGrade: number | null;
  lastSubmissionAt: Date | null;
  /** Red-flag thresholds: missing > 1 OR average < 50 OR no submissions across all assignments. */
  flagged: boolean;
  flagReason: string | null;
};

export async function getMonitoringData(
  lecturerId: number,
  courseId: number,
): Promise<{ course: { id: number; code: string; title: string }; rows: MonitoringRow[] } | null> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, lecturerId },
    select: { id: true, code: true, title: true },
  });
  if (!course) return null;

  const enrollments = await prisma.classEnrollment.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, matricNum: true } } },
    orderBy: { student: { name: "asc" } },
  });

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: { id: true, dueDate: true, maxGrade: true },
  });
  const totalAssignments = assignments.length;
  const studentIds = enrollments.map((e) => e.studentId);

  const submissions = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      assignment: { courseId },
    },
    select: {
      studentId: true,
      status: true,
      grade: true,
      submittedAt: true,
      assignment: { select: { maxGrade: true } },
    },
  });

  const groupMembers = await prisma.groupMember.findMany({
    where: { studentId: { in: studentIds }, group: { courseId } },
    include: { group: { select: { name: true } } },
  });
  const groupByStudent = new Map<number, string>();
  for (const m of groupMembers) groupByStudent.set(m.studentId, m.group.name);

  const rows: MonitoringRow[] = enrollments.map((e) => {
    const subs = submissions.filter((s) => s.studentId === e.studentId);
    const submitted = subs.filter((s) => s.status === "SUBMITTED" || s.status === "GRADED" || s.status === "LATE").length;
    const graded = subs.filter((s) => s.status === "GRADED").length;
    const late = subs.filter((s) => s.status === "LATE").length;
    const missing = Math.max(totalAssignments - submitted, 0);

    // Compute average normalized to 100
    let avg: number | null = null;
    const gradedSubs = subs.filter((s) => s.status === "GRADED" && s.grade !== null);
    if (gradedSubs.length > 0) {
      const sum = gradedSubs.reduce(
        (acc, s) => acc + ((s.grade ?? 0) / (s.assignment.maxGrade ?? 100)) * 100,
        0,
      );
      avg = Math.round(sum / gradedSubs.length);
    }

    const lastSubmissionAt =
      subs.length > 0
        ? subs.reduce<Date | null>(
            (acc, s) => (acc && acc > s.submittedAt ? acc : s.submittedAt),
            null,
          )
        : null;

    let flagReason: string | null = null;
    if (totalAssignments > 0 && submitted === 0) flagReason = "Tiada penghantaran langsung";
    else if (missing >= 2) flagReason = `${missing} tugasan belum dihantar`;
    else if (avg !== null && avg < 50) flagReason = `Purata markah rendah (${avg})`;
    else if (late >= 2) flagReason = `${late} penghantaran lewat`;

    return {
      studentId: e.studentId,
      studentName: e.student.name,
      matricNum: e.student.matricNum,
      groupName: groupByStudent.get(e.studentId) ?? null,
      totalAssignments,
      submitted,
      graded,
      late,
      missing,
      averageGrade: avg,
      lastSubmissionAt,
      flagged: flagReason !== null,
      flagReason,
    };
  });

  rows.sort((a, b) => {
    if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
    return a.studentName.localeCompare(b.studentName);
  });

  return { course, rows };
}
