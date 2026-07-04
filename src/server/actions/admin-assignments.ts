"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany, notifyUser } from "@/lib/notifications";
import { idSchema } from "@/schemas/common";
import type { ActionResult } from "@/schemas/common";

const bulkEnrollSchema = z.object({
  courseId: idSchema,
  studentIds: z.array(idSchema).min(1, "Pilih sekurang-kurangnya 1 pelajar."),
});

const bulkUnenrollSchema = z.object({
  courseId: idSchema,
  studentIds: z.array(idSchema).min(1, "Pilih sekurang-kurangnya 1 pelajar."),
});

const assignLecturerSchema = z.object({
  courseId: idSchema,
  lecturerId: idSchema.nullable(),
});

async function ensureAdmin(): Promise<string | null> {
  const session = await auth();
  if (!session) return "Sesi tidak sah.";
  if (session.user.role !== "ADMIN") return "Hanya admin dibenarkan.";
  return null;
}

/**
 * Add multiple students to a single course. Uses `createMany` with
 * `skipDuplicates` so re-running is safe and idempotent.
 */
export async function bulkEnrollStudents(
  raw: unknown,
): Promise<ActionResult<{ added: number }>> {
  const err = await ensureAdmin();
  if (err) return { ok: false, error: err };

  const parsed = bulkEnrollSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak sah.",
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, code: true, title: true },
  });
  if (!course) return { ok: false, error: "Kursus tidak wujud." };

  // Only enroll users that are actually STUDENT role.
  const students = await prisma.user.findMany({
    where: {
      id: { in: parsed.data.studentIds },
      role: "STUDENT",
      isActive: true,
    },
    select: { id: true },
  });
  if (students.length === 0) {
    return { ok: false, error: "Tiada pelajar sah dipilih." };
  }

  const result = await prisma.classEnrollment.createMany({
    data: students.map((s) => ({ courseId: course.id, studentId: s.id })),
    skipDuplicates: true,
  });

  // Notify the students they've been enrolled (only the newly-added ones would
  // be ideal, but createMany doesn't return them; notifying all selected valid
  // students is acceptable and idempotent-feeling to the user).
  await notifyMany(
    students.map((s) => s.id),
    {
      title: "Didaftarkan ke Kursus",
      message: `Anda telah didaftarkan ke kursus ${course.code} — ${course.title}.`,
      link: "course",
    },
  );

  revalidatePath("/admin/pemberian");
  revalidatePath("/admin/kursus");
  revalidatePath("/admin/pengguna");
  return { ok: true, data: { added: result.count } };
}

/**
 * Remove multiple students from a course. Cascades on related Submission /
 * GroupMember rows is handled by Prisma's relation policies upstream.
 */
export async function bulkUnenrollStudents(
  raw: unknown,
): Promise<ActionResult<{ removed: number }>> {
  const err = await ensureAdmin();
  if (err) return { ok: false, error: err };

  const parsed = bulkUnenrollSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak sah.",
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { code: true, title: true },
  });

  const result = await prisma.classEnrollment.deleteMany({
    where: {
      courseId: parsed.data.courseId,
      studentId: { in: parsed.data.studentIds },
    },
  });

  if (result.count > 0 && course) {
    await notifyMany(parsed.data.studentIds, {
      title: "Dikeluarkan dari Kursus",
      message: `Anda telah dikeluarkan dari kursus ${course.code} — ${course.title}.`,
      link: "course",
    });
  }

  revalidatePath("/admin/pemberian");
  revalidatePath("/admin/kursus");
  return { ok: true, data: { removed: result.count } };
}

/**
 * Set or clear the lecturer assigned to a course. Pass `lecturerId: null` to
 * leave the course without a teacher.
 */
export async function assignCourseLecturer(
  raw: unknown,
): Promise<ActionResult> {
  const err = await ensureAdmin();
  if (err) return { ok: false, error: err };

  const parsed = assignLecturerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak sah.",
    };
  }

  if (parsed.data.lecturerId !== null) {
    const lecturer = await prisma.user.findUnique({
      where: { id: parsed.data.lecturerId },
      select: { id: true, role: true },
    });
    if (!lecturer || lecturer.role !== "LECTURER") {
      return { ok: false, error: "Pengguna bukan pensyarah." };
    }
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { code: true, title: true },
  });

  await prisma.course.update({
    where: { id: parsed.data.courseId },
    data: { lecturerId: parsed.data.lecturerId },
  });

  // Notify the newly-assigned lecturer.
  if (parsed.data.lecturerId !== null && course) {
    await notifyUser(parsed.data.lecturerId, {
      title: "Kursus Ditugaskan",
      message: `Anda telah ditugaskan untuk mengajar ${course.code} — ${course.title}.`,
      link: "course",
    });
  }

  revalidatePath("/admin/pemberian");
  revalidatePath("/admin/kursus");
  return { ok: true };
}
