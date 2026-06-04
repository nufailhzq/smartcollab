"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCourseSchema,
  updateCourseSchema,
  deleteCourseSchema,
} from "@/schemas/admin-course";
import type { ActionResult } from "@/schemas/common";

async function ensureAdmin(): Promise<{ ok: true; userId: number } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "ADMIN") return { ok: false, error: "Tidak dibenarkan." };
  return { ok: true, userId: session.user.id };
}

function bumpCaches(code?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/kursus");
  revalidatePath("/admin/sistem");
  revalidatePath("/student/kursus");
  revalidatePath("/lecturer/kursus");
  if (code) {
    revalidatePath(`/student/kursus/${code}`);
    revalidatePath(`/lecturer/kursus/${code}`);
  }
}

function prismaError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return "Kod kursus sudah digunakan.";
    if (e.code === "P2003") return "Kursus masih mempunyai rekod berkaitan.";
  }
  return "Operasi gagal.";
}

async function validateLecturer(lecturerId: number | null | undefined): Promise<boolean> {
  if (lecturerId == null) return true;
  const u = await prisma.user.findUnique({
    where: { id: lecturerId },
    select: { role: true, isActive: true },
  });
  return !!u && u.role === "LECTURER" && u.isActive;
}

export async function createCourse(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = createCourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  if (!(await validateLecturer(parsed.data.lecturerId ?? null))) {
    return { ok: false, error: "Pensyarah tidak sah atau tidak aktif." };
  }

  try {
    await prisma.course.create({
      data: {
        code: parsed.data.code,
        title: parsed.data.title,
        description: parsed.data.description,
        semester: parsed.data.semester,
        creditHours: parsed.data.creditHours,
        lecturerId: parsed.data.lecturerId ?? null,
      },
    });
  } catch (e) {
    return { ok: false, error: prismaError(e) };
  }

  bumpCaches(parsed.data.code);
  return { ok: true };
}

export async function updateCourse(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = updateCourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const existing = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, code: true },
  });
  if (!existing) return { ok: false, error: "Kursus tidak wujud." };

  if (!(await validateLecturer(parsed.data.lecturerId ?? null))) {
    return { ok: false, error: "Pensyarah tidak sah atau tidak aktif." };
  }

  try {
    await prisma.course.update({
      where: { id: parsed.data.courseId },
      data: {
        code: parsed.data.code,
        title: parsed.data.title,
        description: parsed.data.description,
        semester: parsed.data.semester,
        creditHours: parsed.data.creditHours,
        lecturerId: parsed.data.lecturerId ?? null,
      },
    });
  } catch (e) {
    return { ok: false, error: prismaError(e) };
  }

  bumpCaches(parsed.data.code);
  if (existing.code !== parsed.data.code) bumpCaches(existing.code);
  return { ok: true };
}

export async function deleteCourse(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = deleteCourseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const existing = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { code: true },
  });
  if (!existing) return { ok: false, error: "Kursus tidak wujud." };

  try {
    // Cascading deletes are configured on related models (enrollments, assignments, groups, content).
    await prisma.course.delete({ where: { id: parsed.data.courseId } });
  } catch (e) {
    return { ok: false, error: prismaError(e) };
  }

  bumpCaches(existing.code);
  return { ok: true };
}
