"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import {
  cancelAccessRequestSchema,
  requestJoinGroupSchema,
  requestLeaveGroupSchema,
  respondAccessRequestSchema,
  toggleCourseGroupsLockedSchema,
} from "@/schemas/group-access";
import type { ActionResult } from "@/schemas/common";

function revalidateGroupSurfaces(courseCode?: string) {
  revalidatePath("/student/kumpulan");
  revalidatePath("/lecturer/pengurusan-kumpulan");
  if (courseCode) {
    revalidatePath(`/lecturer/kursus/${courseCode}`);
    revalidatePath(`/student/kursus/${courseCode}`);
  }
}

export async function toggleCourseGroupsLocked(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") {
    return { ok: false, error: "Hanya pensyarah boleh menukar tetapan ini." };
  }

  const parsed = toggleCourseGroupsLockedSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, code: true, lecturerId: true },
  });
  if (!course || course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { groupsLocked: parsed.data.locked },
  });

  revalidateGroupSurfaces(course.code);
  return { ok: true };
}

export async function requestJoinGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh memohon." };
  }

  const parsed = requestJoinGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { id: true, code: true, lecturerId: true, groupsLocked: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (!group.course.groupsLocked) {
    return {
      ok: false,
      error: "Kursus ini tidak terkunci. Sertai terus tanpa permohonan.",
    };
  }

  // Student must be enrolled
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { courseId_studentId: { courseId: group.courseId, studentId } },
  });
  if (!enrollment) return { ok: false, error: "Anda tidak berdaftar dalam kursus ini." };

  // Already in another group?
  const existing = await prisma.groupMember.findFirst({
    where: { studentId, group: { courseId: group.courseId } },
  });
  if (existing) {
    return { ok: false, error: "Anda sudah dalam kumpulan untuk kursus ini." };
  }

  if (group._count.members >= group.maxMembers) {
    return { ok: false, error: "Kumpulan ini sudah penuh." };
  }

  // De-duplicate pending JOIN requests for the same student+course
  const dup = await prisma.groupAccessRequest.findFirst({
    where: {
      studentId,
      courseId: group.courseId,
      type: "JOIN",
      status: "PENDING",
    },
  });
  if (dup) {
    return { ok: false, error: "Permohonan menunggu kelulusan sudah wujud." };
  }

  await prisma.groupAccessRequest.create({
    data: {
      type: "JOIN",
      courseId: group.courseId,
      groupId: group.id,
      studentId,
      reason: parsed.data.reason || null,
    },
  });

  if (group.course.lecturerId) {
    await notifyUser(group.course.lecturerId, {
      title: `Permohonan Sertai Kumpulan — ${group.course.code}`,
      message: `${session.user.name} memohon untuk menyertai ${group.name}.`,
      link: "groups",
    });
  }

  revalidateGroupSurfaces(group.course.code);
  return { ok: true };
}

export async function requestLeaveGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh memohon." };
  }

  const parsed = requestLeaveGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { id: true, code: true, lecturerId: true, groupsLocked: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (!group.course.groupsLocked) {
    return {
      ok: false,
      error: "Kursus ini tidak terkunci. Keluar terus tanpa permohonan.",
    };
  }

  const member = await prisma.groupMember.findFirst({
    where: { groupId: group.id, studentId },
  });
  if (!member) return { ok: false, error: "Anda bukan ahli kumpulan ini." };

  const dup = await prisma.groupAccessRequest.findFirst({
    where: {
      studentId,
      courseId: group.courseId,
      type: "LEAVE",
      status: "PENDING",
    },
  });
  if (dup) return { ok: false, error: "Permohonan menunggu kelulusan sudah wujud." };

  await prisma.groupAccessRequest.create({
    data: {
      type: "LEAVE",
      courseId: group.courseId,
      groupId: group.id,
      studentId,
      reason: parsed.data.reason || null,
    },
  });

  if (group.course.lecturerId) {
    await notifyUser(group.course.lecturerId, {
      title: `Permohonan Keluar Kumpulan — ${group.course.code}`,
      message: `${session.user.name} memohon untuk keluar dari ${group.name}.`,
      link: "groups",
    });
  }

  revalidateGroupSurfaces(group.course.code);
  return { ok: true };
}

export async function cancelAccessRequest(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = cancelAccessRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const req = await prisma.groupAccessRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { course: { select: { code: true } } },
  });
  if (!req) return { ok: false, error: "Permohonan tidak wujud." };
  if (req.studentId !== session.user.id) {
    return { ok: false, error: "Anda hanya boleh batalkan permohonan sendiri." };
  }
  if (req.status !== "PENDING") {
    return { ok: false, error: "Permohonan ini sudah diproses." };
  }

  await prisma.groupAccessRequest.delete({ where: { id: req.id } });
  revalidateGroupSurfaces(req.course.code);
  return { ok: true };
}

export async function approveAccessRequest(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  const parsed = respondAccessRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const req = await prisma.groupAccessRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: {
      course: { select: { id: true, code: true, lecturerId: true } },
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });
  if (!req) return { ok: false, error: "Permohonan tidak wujud." };
  if (req.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (req.status !== "PENDING") {
    return { ok: false, error: "Permohonan ini sudah diproses." };
  }

  if (req.type === "JOIN") {
    if (req.group._count.members >= req.group.maxMembers) {
      return { ok: false, error: "Kumpulan sudah penuh." };
    }
    // Drop student from any other group in this course first (one-group invariant)
    await prisma.$transaction([
      prisma.groupMember.deleteMany({
        where: {
          studentId: req.studentId,
          group: { courseId: req.courseId },
        },
      }),
      prisma.groupMember.create({
        data: { groupId: req.groupId, studentId: req.studentId, role: "MEMBER" },
      }),
      prisma.groupAccessRequest.update({
        where: { id: req.id },
        data: {
          status: "APPROVED",
          respondedById: session.user.id,
          respondedAt: new Date(),
        },
      }),
    ]);

    await notifyUser(req.studentId, {
      title: "Permohonan Sertai Kumpulan Diluluskan",
      message: `Anda kini ahli ${req.group.name} (${req.course.code}).`,
      link: "groups",
    });
  } else {
    // LEAVE
    await prisma.$transaction([
      prisma.groupMember.deleteMany({
        where: { groupId: req.groupId, studentId: req.studentId },
      }),
      prisma.groupAccessRequest.update({
        where: { id: req.id },
        data: {
          status: "APPROVED",
          respondedById: session.user.id,
          respondedAt: new Date(),
        },
      }),
    ]);

    await notifyUser(req.studentId, {
      title: "Permohonan Keluar Kumpulan Diluluskan",
      message: `Anda telah dikeluarkan dari ${req.group.name} (${req.course.code}).`,
      link: "groups",
    });
  }

  revalidateGroupSurfaces(req.course.code);
  return { ok: true };
}

export async function rejectAccessRequest(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  const parsed = respondAccessRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const req = await prisma.groupAccessRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { course: { select: { code: true, lecturerId: true } }, group: { select: { name: true } } },
  });
  if (!req) return { ok: false, error: "Permohonan tidak wujud." };
  if (req.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (req.status !== "PENDING") {
    return { ok: false, error: "Permohonan ini sudah diproses." };
  }

  await prisma.groupAccessRequest.update({
    where: { id: req.id },
    data: {
      status: "REJECTED",
      respondedById: session.user.id,
      respondedAt: new Date(),
    },
  });

  await notifyUser(req.studentId, {
    title:
      req.type === "JOIN"
        ? "Permohonan Sertai Kumpulan Ditolak"
        : "Permohonan Keluar Kumpulan Ditolak",
    message: `Permohonan untuk ${req.group.name} (${req.course.code}) telah ditolak.`,
    link: "groups",
  });

  revalidateGroupSurfaces(req.course.code);
  return { ok: true };
}
