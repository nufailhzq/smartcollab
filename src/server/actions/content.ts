"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyEnrolledStudents } from "@/lib/notifications";
import {
  createAssignmentSchema,
  createCourseContentSchema,
  deleteAssignmentSchema,
  deleteCourseContentSchema,
} from "@/schemas/content";
import type { ActionResult } from "@/schemas/common";

async function ensureOwnsCourse(courseId: number, lecturerId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, lecturerId: true, title: true },
  });
  if (!course || course.lecturerId !== lecturerId) return null;
  return course;
}

export async function createCourseContent(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = createCourseContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const lecturerId = session.user.id;
  const course = await ensureOwnsCourse(parsed.data.courseId, lecturerId);
  if (!course) return { ok: false, error: "Anda bukan pensyarah kursus ini." };

  await prisma.courseContent.create({
    data: {
      courseId: course.id,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content || null,
      fileName: parsed.data.fileName || null,
      postedById: lecturerId,
    },
  });

  // Notify enrolled students about announcements / new notes
  if (parsed.data.type === "ANNOUNCEMENT" || parsed.data.type === "NOTES") {
    await notifyEnrolledStudents(course.id, {
      title:
        parsed.data.type === "ANNOUNCEMENT"
          ? `Pengumuman Baharu — ${course.code}`
          : `Bahan Pembelajaran Baharu — ${course.code}`,
      message: parsed.data.title,
      link: "course",
    });
  }

  revalidatePath(`/student/kursus/${course.code}`);
  revalidatePath(`/lecturer/kursus/${course.code}`);
  return { ok: true };
}

export async function deleteCourseContent(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = deleteCourseContentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const content = await prisma.courseContent.findUnique({
    where: { id: parsed.data.contentId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!content) return { ok: false, error: "Kandungan tidak wujud." };
  if (content.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.courseContent.delete({ where: { id: content.id } });
  revalidatePath(`/student/kursus/${content.course.code}`);
  revalidatePath(`/lecturer/kursus/${content.course.code}`);
  return { ok: true };
}

export async function createAssignment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = createAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const lecturerId = session.user.id;
  const course = await ensureOwnsCourse(parsed.data.courseId, lecturerId);
  if (!course) return { ok: false, error: "Anda bukan pensyarah kursus ini." };

  await prisma.assignment.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      dueDate: new Date(parsed.data.dueDate),
      maxGrade: parsed.data.maxGrade,
    },
  });

  await notifyEnrolledStudents(course.id, {
    title: `Tugasan Baharu — ${course.code}`,
    message: parsed.data.title,
    link: "assignments",
  });

  revalidatePath(`/student/kursus/${course.code}`);
  revalidatePath(`/student/tugasan`);
  revalidatePath(`/lecturer/kursus/${course.code}`);
  revalidatePath(`/lecturer/penghantaran`);
  return { ok: true };
}

export async function deleteAssignment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = deleteAssignmentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const a = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!a) return { ok: false, error: "Tugasan tidak wujud." };
  if (a.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.assignment.delete({ where: { id: a.id } });
  revalidatePath(`/student/kursus/${a.course.code}`);
  revalidatePath(`/lecturer/kursus/${a.course.code}`);
  revalidatePath(`/lecturer/penghantaran`);
  return { ok: true };
}
