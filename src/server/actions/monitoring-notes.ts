"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/permissions";
import { saveMonitoringNoteSchema } from "@/schemas/monitoring-note";
import type { ActionResult } from "@/schemas/common";

/**
 * Upsert the current lecturer's private note for one student in one course.
 * Empty/whitespace-only note → delete (so the cell goes back to "—").
 */
export async function saveMonitoringNote(
  raw: unknown,
): Promise<ActionResult<{ note: string }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER" && session.user.role !== "ADMIN") {
    return { ok: false, error: "Hanya pensyarah boleh menulis catatan." };
  }

  const parsed = saveMonitoringNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const { courseId, studentId, note } = parsed.data;

  // Verify the lecturer owns this course (or is admin).
  const ok = await canManageCourse(session.user.id, courseId, session.user.role);
  if (!ok) return { ok: false, error: "Anda tidak mengajar kursus ini." };

  // Sanity: the student must actually be enrolled in this course.
  const enrolled = await prisma.classEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
    select: { id: true },
  });
  if (!enrolled) return { ok: false, error: "Pelajar tidak berdaftar dalam kursus ini." };

  const trimmed = note.trim();

  if (trimmed.length === 0) {
    await prisma.monitoringNote.deleteMany({
      where: { courseId, lecturerId: session.user.id, studentId },
    });
    revalidatePath("/lecturer/pemantauan");
    return { ok: true, data: { note: "" } };
  }

  await prisma.monitoringNote.upsert({
    where: {
      courseId_lecturerId_studentId: {
        courseId,
        lecturerId: session.user.id,
        studentId,
      },
    },
    update: { note: trimmed },
    create: {
      courseId,
      lecturerId: session.user.id,
      studentId,
      note: trimmed,
    },
  });

  revalidatePath("/lecturer/pemantauan");
  return { ok: true, data: { note: trimmed } };
}
