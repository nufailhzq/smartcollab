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
          feedback: {
            include: { lecturer: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}
