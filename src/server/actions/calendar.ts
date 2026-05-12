"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema, deleteEventSchema } from "@/schemas/calendar";
import type { ActionResult } from "@/schemas/common";

export async function createCalendarEvent(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const { title, description, date, time, courseId, groupId, reminder } = parsed.data;

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

  await prisma.calendarEvent.create({
    data: {
      title,
      description: description ?? null,
      date,
      time,
      courseId: courseId ?? null,
      groupId: groupId ?? null,
      reminder,
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
