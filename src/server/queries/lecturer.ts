import { prisma } from "@/lib/prisma";
import type { Prisma, SubmissionStatus } from "@prisma/client";

export async function getTaughtCourses(lecturerId: number) {
  return prisma.course.findMany({
    where: { lecturerId },
    include: {
      lecturer: { select: { id: true, name: true, matricNum: true, avatarPath: true } },
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
    sort?: "recent" | "name";
    assignmentType?: "INDIVIDUAL" | "GROUP" | "ALL";
  } = {},
) {
  const where: Prisma.SubmissionWhereInput = {
    assignment: {
      course: { lecturerId },
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.assignmentType && filters.assignmentType !== "ALL"
        ? { type: filters.assignmentType }
        : {}),
    },
    ...(filters.assignmentId ? { assignmentId: filters.assignmentId } : {}),
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
  };

  return prisma.submission.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, matricNum: true } },
      submittedBy: { select: { id: true, name: true, matricNum: true } },
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
    // "recent" (default) — newest submission at the top across all statuses.
    // "name" — group submissions per student in alphabetical order, with the
    //          most recent submission per student first inside each group.
    orderBy:
      filters.sort === "name"
        ? [{ student: { name: "asc" } }, { submittedAt: "desc" }]
        : [{ submittedAt: "desc" }],
  });
}

export async function getCourseGroups(lecturerId: number, courseId: number) {
  // Verify ownership
  const course = await prisma.course.findFirst({
    where: { id: courseId, lecturerId },
    select: { id: true, code: true, title: true, groupsLocked: true },
  });
  if (!course) return null;

  const [groups, enrollments, pendingRequests] = await Promise.all([
    prisma.projectGroup.findMany({
      where: { courseId },
      include: {
        members: {
          include: { student: { select: { id: true, name: true, matricNum: true } } },
          orderBy: { role: "asc" },
        },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.classEnrollment.findMany({
      where: { courseId },
      include: { student: { select: { id: true, name: true, matricNum: true } } },
      orderBy: { student: { name: "asc" } },
    }),
    prisma.groupAccessRequest.findMany({
      where: { courseId, status: "PENDING" },
      include: {
        student: { select: { id: true, name: true, matricNum: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Map student → groupId for quick lookup of "ungrouped"
  const groupedStudentIds = new Set<number>();
  for (const g of groups) for (const m of g.members) groupedStudentIds.add(m.studentId);

  const ungroupedStudents = enrollments
    .filter((e) => !groupedStudentIds.has(e.studentId))
    .map((e) => e.student);

  return { course, groups, ungroupedStudents, pendingRequests };
}

export type GradeTrend = "up" | "down" | "flat" | null;

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
  /** When the auth layer last saw this student logged in (throttled to ~5m). */
  lastSeenAt: Date | null;
  /** Real signals — derived from submission timing and grade history, not mock. */
  earlyCount: number;
  onTimeCount: number;
  missedStreak: number;
  recentGrades: number[];
  gradeTrend: GradeTrend;
  /** 0–100 percentile of this student's average grade within the cohort (null if no graded work). */
  cohortPercentile: number | null;
  /** Red-flag thresholds: missing > 1 OR average < 50 OR no submissions across all assignments. */
  flagged: boolean;
  flagReason: string | null;
};

export type MonitoringCourseSummary = {
  /** Median hours between submission and first feedback across this course. */
  medianFeedbackTurnaroundHours: number | null;
  feedbackTurnaroundSampleSize: number;
  /** Submission timing histogram totals across the cohort. */
  timingTotals: { early: number; onTime: number; late: number; missing: number };
  /** Mean of student averages (one data point per graded student). */
  cohortAverageGrade: number | null;
};

const EARLY_WINDOW_HOURS = 24;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function computeTrend(grades: number[]): GradeTrend {
  if (grades.length < 2) return null;
  const first = grades[0]!;
  const last = grades[grades.length - 1]!;
  const delta = last - first;
  if (delta > 5) return "up";
  if (delta < -5) return "down";
  return "flat";
}

export async function getMonitoringData(
  lecturerId: number,
  courseId: number,
): Promise<
  | {
      course: { id: number; code: string; title: string };
      rows: MonitoringRow[];
      summary: MonitoringCourseSummary;
    }
  | null
> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, lecturerId },
    select: { id: true, code: true, title: true },
  });
  if (!course) return null;

  const enrollments = await prisma.classEnrollment.findMany({
    where: { courseId },
    include: {
      student: {
        select: { id: true, name: true, matricNum: true, lastSeenAt: true },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: { id: true, dueDate: true, maxGrade: true },
    orderBy: { dueDate: "asc" },
  });
  const totalAssignments = assignments.length;
  const studentIds = enrollments.map((e) => e.studentId);

  const now = new Date();
  const pastAssignments = assignments
    .filter((a) => a.dueDate && a.dueDate <= now)
    .sort((a, b) => (b.dueDate?.getTime() ?? 0) - (a.dueDate?.getTime() ?? 0)); // newest first

  const submissions = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      assignment: { courseId },
    },
    select: {
      studentId: true,
      assignmentId: true,
      status: true,
      grade: true,
      submittedAt: true,
      assignment: { select: { maxGrade: true, dueDate: true } },
    },
  });

  // Lecturer turnaround — first feedback per submission.
  const feedbackRecords = await prisma.submissionFeedback.findMany({
    where: { submission: { assignment: { courseId } } },
    select: {
      submissionId: true,
      createdAt: true,
      submission: { select: { submittedAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const firstFeedbackBySub = new Map<number, { createdAt: Date; submittedAt: Date }>();
  for (const f of feedbackRecords) {
    if (!firstFeedbackBySub.has(f.submissionId)) {
      firstFeedbackBySub.set(f.submissionId, {
        createdAt: f.createdAt,
        submittedAt: f.submission.submittedAt,
      });
    }
  }
  const turnaroundHours = [...firstFeedbackBySub.values()].map(
    (f) => (f.createdAt.getTime() - f.submittedAt.getTime()) / 3_600_000,
  );

  const groupMembers = await prisma.groupMember.findMany({
    where: { studentId: { in: studentIds }, group: { courseId } },
    include: { group: { select: { name: true } } },
  });
  const groupByStudent = new Map<number, string>();
  for (const m of groupMembers) groupByStudent.set(m.studentId, m.group.name);

  // Pass 1: compute base per-student metrics (avg, counts, recent grades).
  type Pass1 = {
    studentId: number;
    studentName: string;
    matricNum: string | null;
    submitted: number;
    graded: number;
    late: number;
    earlyCount: number;
    onTimeCount: number;
    missing: number;
    average: number | null;
    lastSubmissionAt: Date | null;
    lastSeenAt: Date | null;
    recentGrades: number[];
    missedStreak: number;
  };

  const pass1: Pass1[] = enrollments.map((e) => {
    const subs = submissions.filter((s) => s.studentId === e.studentId);
    const submitted = subs.filter(
      (s) => s.status === "SUBMITTED" || s.status === "GRADED" || s.status === "LATE",
    ).length;
    const graded = subs.filter((s) => s.status === "GRADED").length;
    const late = subs.filter((s) => s.status === "LATE").length;
    const missing = Math.max(totalAssignments - submitted, 0);

    // Timing distribution: classify each submission relative to its dueDate.
    let earlyCount = 0;
    let onTimeCount = 0;
    for (const s of subs) {
      if (s.status === "PENDING") continue;
      if (s.status === "LATE") continue; // already counted
      const due = s.assignment.dueDate;
      if (!due) {
        onTimeCount++;
        continue;
      }
      const hoursBefore = (due.getTime() - s.submittedAt.getTime()) / 3_600_000;
      if (hoursBefore >= EARLY_WINDOW_HOURS) earlyCount++;
      else onTimeCount++;
    }

    // Average grade normalized to 100.
    const gradedSubs = subs.filter((s) => s.status === "GRADED" && s.grade !== null);
    let avg: number | null = null;
    if (gradedSubs.length > 0) {
      const sum = gradedSubs.reduce(
        (acc, s) => acc + ((s.grade ?? 0) / (s.assignment.maxGrade ?? 100)) * 100,
        0,
      );
      avg = Math.round(sum / gradedSubs.length);
    }

    const lastSubmissionAt = subs.length
      ? subs.reduce<Date | null>(
          (acc, s) => (acc && acc > s.submittedAt ? acc : s.submittedAt),
          null,
        )
      : null;

    // Recent graded scores in chronological order (oldest → newest), up to 3.
    const recentGrades = gradedSubs
      .slice()
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
      .map((s) => Math.round(((s.grade ?? 0) / (s.assignment.maxGrade ?? 100)) * 100))
      .slice(-3);

    // Missed-deadline streak: walk past assignments newest-first; count consecutive
    // missing until we hit one this student did submit.
    const submittedAssignmentIds = new Set(
      subs
        .filter((s) => s.status !== "PENDING")
        .map((s) => s.assignmentId),
    );
    let missedStreak = 0;
    for (const a of pastAssignments) {
      if (submittedAssignmentIds.has(a.id)) break;
      missedStreak++;
    }

    return {
      studentId: e.studentId,
      studentName: e.student.name,
      matricNum: e.student.matricNum,
      submitted,
      graded,
      late,
      earlyCount,
      onTimeCount,
      missing,
      average: avg,
      lastSubmissionAt,
      lastSeenAt: e.student.lastSeenAt,
      recentGrades,
      missedStreak,
    };
  });

  // Cohort percentile — rank students by average grade.
  const gradedAverages = pass1
    .map((p) => p.average)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const cohortAverageGrade = gradedAverages.length
    ? Math.round(gradedAverages.reduce((acc, v) => acc + v, 0) / gradedAverages.length)
    : null;

  function percentile(value: number): number {
    if (gradedAverages.length === 0) return 0;
    // Count of values strictly less + half of ties, then normalize.
    const below = gradedAverages.filter((v) => v < value).length;
    const equal = gradedAverages.filter((v) => v === value).length;
    return Math.round(((below + equal / 2) / gradedAverages.length) * 100);
  }

  // Timing histogram totals.
  const timingTotals = pass1.reduce(
    (acc, p) => {
      acc.early += p.earlyCount;
      acc.onTime += p.onTimeCount;
      acc.late += p.late;
      acc.missing += p.missing;
      return acc;
    },
    { early: 0, onTime: 0, late: 0, missing: 0 },
  );

  const rows: MonitoringRow[] = pass1.map((p) => {
    const trend = computeTrend(p.recentGrades);
    const cohortPercentile = p.average !== null ? percentile(p.average) : null;

    let flagReason: string | null = null;
    if (totalAssignments > 0 && p.submitted === 0) flagReason = "Tiada penghantaran langsung";
    else if (p.missedStreak >= 2) flagReason = `${p.missedStreak} tugasan berturut-turut terlepas`;
    else if (p.missing >= 2) flagReason = `${p.missing} tugasan belum dihantar`;
    else if (p.average !== null && p.average < 50) flagReason = `Purata markah rendah (${p.average})`;
    else if (trend === "down" && p.recentGrades.length >= 2) {
      const first = p.recentGrades[0]!;
      const last = p.recentGrades[p.recentGrades.length - 1]!;
      flagReason = `Markah menurun (${first} → ${last})`;
    } else if (p.late >= 2) flagReason = `${p.late} penghantaran lewat`;

    return {
      studentId: p.studentId,
      studentName: p.studentName,
      matricNum: p.matricNum,
      groupName: groupByStudent.get(p.studentId) ?? null,
      totalAssignments,
      submitted: p.submitted,
      graded: p.graded,
      late: p.late,
      missing: p.missing,
      averageGrade: p.average,
      lastSubmissionAt: p.lastSubmissionAt,
      lastSeenAt: p.lastSeenAt,
      earlyCount: p.earlyCount,
      onTimeCount: p.onTimeCount,
      missedStreak: p.missedStreak,
      recentGrades: p.recentGrades,
      gradeTrend: trend,
      cohortPercentile,
      flagged: flagReason !== null,
      flagReason,
    };
  });

  rows.sort((a, b) => {
    if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
    return a.studentName.localeCompare(b.studentName);
  });

  const medianTurnaround = median(turnaroundHours);
  const summary: MonitoringCourseSummary = {
    medianFeedbackTurnaroundHours:
      medianTurnaround !== null ? Math.round(medianTurnaround * 10) / 10 : null,
    feedbackTurnaroundSampleSize: turnaroundHours.length,
    timingTotals,
    cohortAverageGrade,
  };

  return { course, rows, summary };
}
