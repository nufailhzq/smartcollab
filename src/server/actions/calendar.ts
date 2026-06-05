"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createEventSchema,
  createTimetableEntrySchema,
  deleteEventSchema,
  deleteTimetableEntrySchema,
} from "@/schemas/calendar";
import type { ActionResult } from "@/schemas/common";

export async function createCalendarEvent(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const {
    title,
    description,
    date,
    time,
    courseId,
    groupId,
    reminder,
    notifyBeforeMinutes,
  } = parsed.data;

  // If courseId provided, must be enrolled (student) or own (lecturer)
  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: { where: { studentId: session.user.id }, select: { id: true } },
      },
    });
    if (!course) return { ok: false, error: "Kursus tidak wujud." };
    const isOwner = course.lecturerId === session.user.id;
    const isEnrolled = course.enrollments.length > 0;
    if (!isOwner && !isEnrolled && session.user.role !== "ADMIN") {
      return { ok: false, error: "Tidak dibenarkan untuk kursus ini." };
    }
  }

  // If groupId provided, must be a member (or lecturer of the course)
  if (groupId) {
    const group = await prisma.projectGroup.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { studentId: session.user.id }, select: { id: true } },
        course: { select: { lecturerId: true } },
      },
    });
    if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
    const isOwner = group.course.lecturerId === session.user.id;
    const isMember = group.members.length > 0;
    if (!isOwner && !isMember && session.user.role !== "ADMIN") {
      return { ok: false, error: "Tidak dibenarkan untuk kumpulan ini." };
    }
  }

  // If the requested advance reminder has already passed (event is in the
  // past or the cutoff has already arrived), seed `notifiedAt` so the
  // dispatcher won't fire a stale reminder on the next dashboard load.
  const eventInstant = new Date(date);
  const [hh, mm] = String(time).split(":").map(Number);
  eventInstant.setHours(hh ?? 0, mm ?? 0, 0, 0);
  const reminderAt =
    notifyBeforeMinutes != null
      ? new Date(eventInstant.getTime() - notifyBeforeMinutes * 60_000)
      : null;
  const seedNotifiedAt =
    reminderAt && reminderAt < new Date() ? new Date() : null;

  await prisma.calendarEvent.create({
    data: {
      title,
      description: description ?? null,
      date,
      time,
      courseId: courseId ?? null,
      groupId: groupId ?? null,
      reminder,
      notifyBeforeMinutes: notifyBeforeMinutes ?? null,
      notifiedAt: seedNotifiedAt,
      createdById: session.user.id,
    },
  });

  revalidatePath("/student/kalendar");
  revalidatePath("/lecturer/kalendar");
  return { ok: true };
}

export async function deleteCalendarEvent(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = deleteEventSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const event = await prisma.calendarEvent.findUnique({
    where: { id: parsed.data.eventId },
  });
  if (!event) return { ok: false, error: "Acara tidak wujud." };
  if (event.createdById !== session.user.id && session.user.role !== "ADMIN") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  await prisma.calendarEvent.delete({ where: { id: event.id } });

  revalidatePath("/student/kalendar");
  revalidatePath("/lecturer/kalendar");
  return { ok: true };
}

/**
 * Change the reminder on an existing event. Pass null to clear it.
 * Resets `notifiedAt` if the new cutoff is still in the future so the
 * dispatcher can fire on the new schedule.
 */
export async function updateEventReminder(
  rawEventId: unknown,
  rawMinutes: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const eventId = Number(rawEventId);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return { ok: false, error: "Input tidak sah." };
  }
  const raw = Number(rawMinutes);
  const minutes = Number.isInteger(raw) && raw > 0 ? raw : null;

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      createdById: true,
      date: true,
      time: true,
    },
  });
  if (!event) return { ok: false, error: "Acara tidak wujud." };
  if (event.createdById !== session.user.id && session.user.role !== "ADMIN") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  // Compute whether the new cutoff has already passed — if so, mark
  // `notifiedAt` to suppress a stale ping; otherwise clear it so the
  // dispatcher gets a fresh shot.
  let notifiedAt: Date | null = null;
  if (minutes !== null) {
    const eventInstant = new Date(event.date);
    const [hh, mm] = (event.time || "00:00").split(":").map(Number);
    eventInstant.setHours(hh ?? 0, mm ?? 0, 0, 0);
    const cutoff = new Date(eventInstant.getTime() - minutes * 60_000);
    if (cutoff < new Date()) notifiedAt = new Date();
  }

  await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      notifyBeforeMinutes: minutes,
      reminder: minutes !== null,
      notifiedAt,
    },
  });

  revalidatePath("/student/kalendar");
  revalidatePath("/lecturer/kalendar");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Per-student weekly timetable (private to the student who created it)
// ---------------------------------------------------------------------------

export async function createTimetableEntry(
  raw: unknown,
): Promise<ActionResult<{ entryId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return {
      ok: false,
      error: "Hanya pelajar boleh menyediakan jadual peribadi.",
    };
  }

  const parsed = createTimetableEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak sah.",
    };
  }

  const entry = await prisma.timetableEntry.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      location: parsed.data.location ?? null,
      color: parsed.data.color ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/student/kalendar");
  return { ok: true, data: { entryId: entry.id } };
}

export async function deleteTimetableEntry(
  raw: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = deleteTimetableEntrySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const entry = await prisma.timetableEntry.findUnique({
    where: { id: parsed.data.entryId },
    select: { id: true, userId: true },
  });
  if (!entry) return { ok: false, error: "Tiada jadual." };
  if (entry.userId !== session.user.id) {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  await prisma.timetableEntry.delete({ where: { id: entry.id } });
  revalidatePath("/student/kalendar");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reminder dispatcher — call from a dashboard/calendar load. For every event
// the viewer can see whose `notifyBeforeMinutes` cutoff has arrived but
// `notifiedAt` is still null, create a notification and stamp the row.
// Throttled to one batch per user per 60s via an in-memory map so we don't
// recheck on every request.
// ---------------------------------------------------------------------------

const lastDispatchAt = new Map<number, number>();

export async function dispatchDueEventReminders(
  userId: number,
): Promise<{ fired: number }> {
  const now = Date.now();
  const prev = lastDispatchAt.get(userId);
  if (prev && now - prev < 60_000) return { fired: 0 };
  lastDispatchAt.set(userId, now);

  const horizon = new Date(now + 30 * 24 * 60 * 60_000);
  const events = await prisma.calendarEvent.findMany({
    where: {
      notifyBeforeMinutes: { not: null },
      notifiedAt: null,
      date: { lte: horizon },
      OR: [
        { createdById: userId },
        { course: { enrollments: { some: { studentId: userId } } } },
        { group: { members: { some: { studentId: userId } } } },
        { course: { lecturerId: userId } },
      ],
    },
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      notifyBeforeMinutes: true,
      course: { select: { code: true } },
    },
  });

  let fired = 0;
  for (const e of events) {
    const eventInstant = new Date(e.date);
    const [hh, mm] = (e.time || "00:00").split(":").map(Number);
    eventInstant.setHours(hh ?? 0, mm ?? 0, 0, 0);
    const cutoff = new Date(
      eventInstant.getTime() - (e.notifyBeforeMinutes ?? 0) * 60_000,
    );
    if (cutoff > new Date()) continue;

    // Race-safe stamp: only fire if we win the update.
    const claim = await prisma.calendarEvent.updateMany({
      where: { id: e.id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
    if (claim.count === 0) continue;

    const when = eventInstant.toLocaleString("ms-MY", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    await prisma.notification.create({
      data: {
        userId,
        title: `🔔 Acara: ${e.title}`,
        message: `${e.course?.code ? `[${e.course.code}] ` : ""}${when}`,
        link: "/student/kalendar",
      },
    });
    fired++;
  }

  return { fired };
}
