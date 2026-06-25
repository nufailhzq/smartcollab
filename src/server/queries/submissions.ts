import { prisma } from "@/lib/prisma";

export async function getStudentAssignments(studentId: number, courseId?: number) {
  return prisma.assignment.findMany({
    where: {
      course: { enrollments: { some: { studentId } } },
      ...(courseId ? { courseId } : {}),
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
      submissions: {
        where: { studentId },
        include: {
          submittedBy: { select: { id: true, name: true, matricNum: true } },
          feedback: {
            include: { lecturer: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }],
  });
}

export async function getUpcomingAssignments(studentId: number, take = 5) {
  return prisma.assignment.findMany({
    where: {
      course: { enrollments: { some: { studentId } } },
      dueDate: { gte: new Date() },
    },
    include: {
      course: { select: { id: true, code: true } },
      submissions: { where: { studentId }, select: { id: true, status: true } },
    },
    orderBy: { dueDate: "asc" },
    take,
  });
}

export async function getAssignmentForStudent(studentId: number, assignmentId: number) {
  return prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: { enrollments: { some: { studentId } } },
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
      submissions: {
        where: { studentId },
        include: {
          submittedBy: { select: { id: true, name: true, matricNum: true } },
          feedback: {
            include: { lecturer: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}

export type GroupSubmissionEntry = {
  /** The group member this submission row belongs to. */
  memberId: number;
  memberName: string;
  memberMatric: string | null;
  memberAvatar: string | null;
  /** The shared file (null if this member has no submission yet). */
  filePath: string | null;
  submittedAt: Date | null;
  /** Who actually clicked submit (may differ from the member, since GROUP
   *  submissions are propagated on behalf of the whole group). */
  submittedById: number | null;
  submittedByName: string | null;
};

export type GroupSubmissions = {
  groupId: number;
  groupName: string;
  entries: GroupSubmissionEntry[];
};

/**
 * Peer file-sharing view for a GROUP assignment. Resolves the viewer's group in
 * THIS assignment's grouping context — exactly as the submit action does
 * (INHERIT → standing group with assignmentId null; CUSTOM/RANDOM → ad-hoc group
 * scoped to the assignment) — then returns one entry per group member with their
 * submission row (file + who submitted it + when). Members without a submission
 * yet appear with null fields so the UI can show "Belum dihantar".
 *
 * Returns null when the viewer isn't enrolled, the assignment isn't a GROUP
 * assignment, or the viewer isn't in a group for it (nothing to share).
 */
export async function getGroupSubmissions(
  studentId: number,
  assignmentId: number,
): Promise<GroupSubmissions | null> {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, course: { enrollments: { some: { studentId } } } },
    select: { id: true, type: true, groupingMode: true, courseId: true },
  });
  if (!assignment || assignment.type !== "GROUP") return null;

  const groupContext =
    assignment.groupingMode === "INHERIT"
      ? { courseId: assignment.courseId, assignmentId: null }
      : { assignmentId: assignment.id };

  const group = await prisma.projectGroup.findFirst({
    where: { ...groupContext, members: { some: { studentId } } },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          student: { select: { id: true, name: true, matricNum: true, avatarPath: true } },
        },
        orderBy: { student: { name: "asc" } },
      },
    },
  });
  if (!group) return null;

  // One round-trip for every member's submission row for this assignment.
  const memberIds = group.members.map((m) => m.student.id);
  const subs = await prisma.submission.findMany({
    where: { assignmentId: assignment.id, studentId: { in: memberIds } },
    select: {
      studentId: true,
      filePath: true,
      submittedAt: true,
      submittedBy: { select: { id: true, name: true } },
    },
  });
  const byStudent = new Map(subs.map((s) => [s.studentId, s]));

  const entries: GroupSubmissionEntry[] = group.members.map((m) => {
    const sub = byStudent.get(m.student.id);
    return {
      memberId: m.student.id,
      memberName: m.student.name,
      memberMatric: m.student.matricNum,
      memberAvatar: m.student.avatarPath,
      filePath: sub?.filePath ?? null,
      submittedAt: sub?.submittedAt ?? null,
      submittedById: sub?.submittedBy?.id ?? null,
      submittedByName: sub?.submittedBy?.name ?? null,
    };
  });

  return { groupId: group.id, groupName: group.name, entries };
}
