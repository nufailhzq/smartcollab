import { prisma } from "./prisma";
import type { Assignment } from "@prisma/client";

export async function recipientsFor(assignment: Assignment): Promise<number[]> {
  if (assignment.groupingMode === "INDIVIDUAL") {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { courseId: assignment.courseId },
      select: { studentId: true },
    });
    return enrollments.map((e) => e.studentId);
  }

  const members = await prisma.groupMember.findMany({
    where: {
      group:
        assignment.groupingMode === "INHERIT"
          ? { courseId: assignment.courseId, assignmentId: null, status: "APPROVED" }
          : { assignmentId: assignment.id },
    },
    select: { studentId: true },
  });
  return Array.from(new Set(members.map((m) => m.studentId)));
}
