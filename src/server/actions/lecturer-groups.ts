"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import {
  assignStudentSchema,
  createGroupSchema,
  deleteGroupSchema,
  removeStudentSchema,
  updateGroupSchema,
} from "@/schemas/lecturer-group";
import type { ActionResult } from "@/schemas/common";

async function ensureLecturerOwnsCourse(courseId: number, lecturerId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, lecturerId: true },
  });
  if (!course || course.lecturerId !== lecturerId) return null;
  return course;
}

export async function createGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = createGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const course = await ensureLecturerOwnsCourse(parsed.data.courseId, session.user.id);
  if (!course) return { ok: false, error: "Anda bukan pensyarah kursus ini." };

  await prisma.projectGroup.create({
    data: {
      courseId: course.id,
      name: parsed.data.name,
      maxMembers: parsed.data.maxMembers,
    },
  });

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function updateGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = updateGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { code: true, lecturerId: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (parsed.data.maxMembers < group._count.members) {
    return {
      ok: false,
      error: `Saiz baharu (${parsed.data.maxMembers}) lebih kecil daripada bilangan ahli sedia ada (${group._count.members}).`,
    };
  }

  await prisma.projectGroup.update({
    where: { id: group.id },
    data: { name: parsed.data.name, maxMembers: parsed.data.maxMembers },
  });

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function deleteGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = deleteGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.projectGroup.delete({ where: { id: group.id } });
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function assignStudentToGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = assignStudentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { id: true, code: true, lecturerId: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (group._count.members >= group.maxMembers) {
    return { ok: false, error: "Kumpulan sudah penuh." };
  }

  // Student must be enrolled in the course
  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      courseId_studentId: { courseId: group.course.id, studentId: parsed.data.studentId },
    },
  });
  if (!enrollment) {
    return { ok: false, error: "Pelajar tidak berdaftar dalam kursus ini." };
  }

  // One group per student per course — remove from any existing group first
  await prisma.groupMember.deleteMany({
    where: {
      studentId: parsed.data.studentId,
      group: { courseId: group.course.id },
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      studentId: parsed.data.studentId,
      role: parsed.data.role,
    },
  });

  await notifyUser(parsed.data.studentId, {
    title: `Ditambah ke ${group.name}`,
    message: `Pensyarah telah meletakkan anda dalam ${group.name} (${group.course.code}).`,
    link: "groups",
  });

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function removeStudentFromGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = removeStudentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.groupMember.deleteMany({
    where: { groupId: group.id, studentId: parsed.data.studentId },
  });
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}
