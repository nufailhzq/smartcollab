import { prisma } from "./prisma";
import type { Assignment, Prisma } from "@prisma/client";

/**
 * The single source of truth for "which ProjectGroups belong to this assignment".
 * Both recipientsFor (flat student ids) and rowsFor (group/student rows) derive
 * from this, so the two can never drift apart.
 *   - INHERIT          -> approved standing groups of the course
 *   - CUSTOM / RANDOM   -> this assignment's ad-hoc groups
 *   - INDIVIDUAL        -> (no groups; callers use the enrolled roster instead)
 */
function groupWhereFor(assignment: Assignment): Prisma.ProjectGroupWhereInput {
  return assignment.groupingMode === "INHERIT"
    ? { courseId: assignment.courseId, assignmentId: null, status: "APPROVED" }
    : { assignmentId: assignment.id };
}

export async function recipientsFor(assignment: Assignment): Promise<number[]> {
  if (assignment.groupingMode === "INDIVIDUAL") {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { courseId: assignment.courseId },
      select: { studentId: true },
    });
    return enrollments.map((e) => e.studentId);
  }

  const members = await prisma.groupMember.findMany({
    where: { group: groupWhereFor(assignment) },
    select: { studentId: true },
  });
  return Array.from(new Set(members.map((m) => m.studentId)));
}

/**
 * A row in the progress grid. For group modes this is one ProjectGroup; for
 * INDIVIDUAL it is one enrolled student. `memberIds` is the set of student ids
 * whose submissions count toward this row's status for the assignment.
 */
export type AssignmentRow = {
  id: number;
  label: string;
  isGroup: boolean;
  memberIds: number[];
};

/**
 * The grouping structure (rows) for an assignment, sharing groupWhereFor with
 * recipientsFor so the denominator matches the recipient set exactly.
 */
export async function rowsFor(assignment: Assignment): Promise<AssignmentRow[]> {
  if (assignment.groupingMode === "INDIVIDUAL") {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { courseId: assignment.courseId },
      select: {
        student: { select: { id: true, name: true, matricNum: true } },
      },
      orderBy: { student: { name: "asc" } },
    });
    return enrollments.map((e) => ({
      id: e.student.id,
      label: e.student.matricNum
        ? `${e.student.name} (${e.student.matricNum})`
        : e.student.name,
      isGroup: false,
      memberIds: [e.student.id],
    }));
  }

  const groups = await prisma.projectGroup.findMany({
    where: groupWhereFor(assignment),
    select: {
      id: true,
      name: true,
      members: { select: { studentId: true } },
    },
    orderBy: { name: "asc" },
  });
  return groups.map((g) => ({
    id: g.id,
    label: g.name,
    isGroup: true,
    memberIds: g.members.map((m) => m.studentId),
  }));
}
