"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/schemas/common";

/**
 * Lazily creates a ChatGroup paired with a ProjectGroup so all project-group
 * members share one chatroom. Idempotent: if the link already exists, returns
 * the existing chatGroupId.
 *
 * Permission: caller must be a member of the project group OR the course's lecturer.
 */
export async function ensureProjectGroupChat(
  projectGroupId: number,
): Promise<ActionResult<{ chatGroupId: number; created: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: projectGroupId },
    include: {
      course: { select: { id: true, code: true, lecturerId: true } },
      members: { include: { student: { select: { id: true, name: true } } } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };

  const isMember = group.members.some((m) => m.studentId === session.user.id);
  const isLecturer = group.course.lecturerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isMember && !isLecturer && !isAdmin) {
    return { ok: false, error: "Anda tiada akses ke kumpulan ini." };
  }

  // Fast path: already linked.
  if (group.chatGroupId) {
    return { ok: true, data: { chatGroupId: group.chatGroupId, created: false } };
  }

  const chatName = `${group.course.code} · ${group.name}`;
  const memberIds = new Set<number>(group.members.map((m) => m.studentId));
  if (group.course.lecturerId) memberIds.add(group.course.lecturerId);

  const creatorId = isLecturer
    ? group.course.lecturerId!
    : group.members[0]?.studentId ?? session.user.id;

  const chatGroup = await prisma.chatGroup.create({
    data: {
      name: chatName,
      createdById: creatorId,
      members: {
        create: [...memberIds].map((userId) => ({
          userId,
          isAdmin: userId === creatorId,
        })),
      },
    },
    select: { id: true },
  });

  await prisma.projectGroup.update({
    where: { id: projectGroupId },
    data: { chatGroupId: chatGroup.id },
  });

  revalidatePath("/student");
  revalidatePath("/student/kumpulan");
  revalidatePath("/lecturer");
  return { ok: true, data: { chatGroupId: chatGroup.id, created: true } };
}
