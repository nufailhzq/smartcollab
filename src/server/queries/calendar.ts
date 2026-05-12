import { prisma } from "@/lib/prisma";

export async function getCalendarForStudent(studentId: number) {
  // 1. Real events the student created OR scoped to courses they're enrolled in
  //    OR scoped to groups they belong to.
  const events = await prisma.calendarEvent.findMany({
    where: {
      OR: [
        { createdById: studentId },
        { course: { enrollments: { some: { studentId } } } },
        { group: { members: { some: { studentId } } } },
      ],
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  // 2. Synthetic deadline pseudo-events from upcoming assignments
  const assignments = await prisma.assignment.findMany({
    where: {
      course: { enrollments: { some: { studentId } } },
      dueDate: { not: null },
    },
    include: { course: { select: { id: true, code: true } } },
    orderBy: { dueDate: "asc" },
  });

  return { events, assignments };
}

export async function getCalendarForLecturer(lecturerId: number) {
  const events = await prisma.calendarEvent.findMany({
    where: {
      OR: [
        { createdById: lecturerId },
        { course: { lecturerId } },
      ],
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const assignments = await prisma.assignment.findMany({
    where: { course: { lecturerId }, dueDate: { not: null } },
    include: { course: { select: { id: true, code: true } } },
    orderBy: { dueDate: "asc" },
  });

  return { events, assignments };
}
