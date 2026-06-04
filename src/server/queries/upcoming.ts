import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type UpcomingItem = {
  kind: "ASSIGNMENT" | "EVENT";
  id: string;
  title: string;
  date: Date;
  /** "14:00" or null for date-only items. */
  time: string | null;
  link: string;
  context: string | null;
};

export async function getUpcomingForUser(
  userId: number,
  role: Role,
  limit = 6,
): Promise<UpcomingItem[]> {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  if (role === "STUDENT") {
    const [assignments, events] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          course: { enrollments: { some: { studentId: userId } } },
          dueDate: { gte: now, lte: horizon },
        },
        select: { id: true, title: true, dueDate: true, course: { select: { code: true } } },
        orderBy: { dueDate: "asc" },
        take: limit,
      }),
      prisma.calendarEvent.findMany({
        where: {
          date: { gte: now, lte: horizon },
          OR: [
            { course: { enrollments: { some: { studentId: userId } } } },
            { group: { members: { some: { studentId: userId } } } },
            { createdById: userId },
          ],
        },
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          course: { select: { code: true } },
          group: { select: { name: true } },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        take: limit,
      }),
    ]);

    return mergeAndTrim(assignments, events, limit, "STUDENT");
  }

  if (role === "LECTURER") {
    const [assignments, events] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          course: { lecturerId: userId },
          dueDate: { gte: now, lte: horizon },
        },
        select: { id: true, title: true, dueDate: true, course: { select: { code: true } } },
        orderBy: { dueDate: "asc" },
        take: limit,
      }),
      prisma.calendarEvent.findMany({
        where: {
          date: { gte: now, lte: horizon },
          OR: [{ course: { lecturerId: userId } }, { createdById: userId }],
        },
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          course: { select: { code: true } },
          group: { select: { name: true } },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        take: limit,
      }),
    ]);

    return mergeAndTrim(assignments, events, limit, "LECTURER");
  }

  return [];
}

type AssignmentRow = {
  id: number;
  title: string;
  dueDate: Date | null;
  course: { code: string };
};
type EventRow = {
  id: number;
  title: string;
  date: Date;
  time: string;
  course: { code: string } | null;
  group: { name: string } | null;
};

function mergeAndTrim(
  assignments: AssignmentRow[],
  events: EventRow[],
  limit: number,
  role: "STUDENT" | "LECTURER",
): UpcomingItem[] {
  const items: UpcomingItem[] = [];

  for (const a of assignments) {
    if (!a.dueDate) continue;
    items.push({
      kind: "ASSIGNMENT",
      id: `a-${a.id}`,
      title: a.title,
      date: a.dueDate,
      time: null,
      link:
        role === "STUDENT" ? `/student/tugasan/${a.id}` : `/lecturer/penghantaran?course=${a.course.code}`,
      context: a.course.code,
    });
  }

  for (const e of events) {
    items.push({
      kind: "EVENT",
      id: `e-${e.id}`,
      title: e.title,
      date: e.date,
      time: e.time ? e.time.slice(0, 5) : null,
      link: role === "STUDENT" ? "/student/kalendar" : "/lecturer/kalendar",
      context: e.course?.code ?? e.group?.name ?? null,
    });
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  return items.slice(0, limit);
}
