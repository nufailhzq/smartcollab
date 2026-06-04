"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { joinGroupSchema, leaveGroupSchema } from "@/schemas/group";
import type { ActionResult } from "@/schemas/common";

export async function joinGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh menyertai kumpulan." };
  }

  const parsed = joinGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const { groupId } = parsed.data;

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      course: { select: { code: true, groupsLocked: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.groupsLocked) {
    return {
      ok: false,
      error: "Kursus ini terkunci — sila mohon kelulusan pensyarah.",
    };
  }

  // Verify student is enrolled in the group's course
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { courseId_studentId: { courseId: group.courseId, studentId } },
  });
  if (!enrollment) {
    return { ok: false, error: "Anda tidak berdaftar dalam kursus kumpulan ini." };
  }

  // One group per student per course
  const existing = await prisma.groupMember.findFirst({
    where: { studentId, group: { courseId: group.courseId } },
  });
  if (existing) {
    return { ok: false, error: "Anda sudah dalam kumpulan untuk kursus ini." };
  }

  if (group._count.members >= group.maxMembers) {
    return { ok: false, error: "Kumpulan ini sudah penuh." };
  }

  await prisma.groupMember.create({
    data: { groupId, studentId, role: "MEMBER" },
  });

  await notifyUser(studentId, {
    title: "Sertai Kumpulan",
    message: `Anda kini ahli ${group.name}.`,
    link: "groups",
  });

  revalidatePath("/student");
  revalidatePath("/student/kumpulan");
  // Sync the lecturer's view so they see the change without a manual refresh.
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  return { ok: true };
}

export async function leaveGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = leaveGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: { course: { select: { code: true, groupsLocked: true } } },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.groupsLocked) {
    return {
      ok: false,
      error: "Kursus ini terkunci — sila mohon kelulusan pensyarah.",
    };
  }

  const result = await prisma.groupMember.deleteMany({
    where: { groupId: parsed.data.groupId, studentId: session.user.id },
  });
  if (result.count === 0) {
    return { ok: false, error: "Anda bukan ahli kumpulan ini." };
  }

  revalidatePath("/student");
  revalidatePath("/student/kumpulan");
  // Sync the lecturer's view too.
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  return { ok: true };
}
