"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  removeFriendSchema,
} from "@/schemas/friend";
import type { ActionResult } from "@/schemas/common";
import { searchUsersForFriend } from "@/server/queries/messages";
import type { Role } from "@prisma/client";

function revalidateFriendSurfaces() {
  revalidatePath("/student");
  revalidatePath("/lecturer");
}

export async function sendFriendRequest(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = sendFriendRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const me = session.user.id;
  const to = parsed.data.to;
  if (me === to) {
    return { ok: false, error: "Tidak boleh menghantar permintaan kepada diri sendiri." };
  }

  const target = await prisma.user.findUnique({ where: { id: to }, select: { id: true } });
  if (!target) return { ok: false, error: "Pengguna tidak wujud." };

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: me, receiverId: to },
        { senderId: to, receiverId: me },
      ],
    },
  });
  if (existing) return { ok: false, error: "Permintaan rakan sudah wujud." };

  await prisma.friendship.create({
    data: { senderId: me, receiverId: to, status: "PENDING" },
  });

  await notifyUser(to, {
    title: "Permintaan Rakan Baharu",
    message: `${session.user.name} menghantar permintaan rakan kepada anda.`,
    link: "chat",
  });

  revalidateFriendSurfaces();
  return { ok: true };
}

export async function acceptFriendRequest(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = respondFriendRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const friendship = await prisma.friendship.findUnique({
    where: { id: parsed.data.friendshipId },
  });
  if (!friendship) return { ok: false, error: "Permintaan tidak wujud." };
  if (friendship.receiverId !== session.user.id) {
    return { ok: false, error: "Tidak dibenarkan." };
  }
  if (friendship.status === "ACCEPTED") return { ok: true };

  await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "ACCEPTED" },
  });

  await notifyUser(friendship.senderId, {
    title: "Permintaan Rakan Diterima",
    message: `${session.user.name} telah menerima permintaan rakan anda.`,
    link: "chat",
  });

  revalidateFriendSurfaces();
  return { ok: true };
}

export async function rejectFriendRequest(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = respondFriendRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const friendship = await prisma.friendship.findUnique({
    where: { id: parsed.data.friendshipId },
  });
  if (!friendship) return { ok: false, error: "Permintaan tidak wujud." };
  if (friendship.receiverId !== session.user.id) {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });

  revalidateFriendSurfaces();
  return { ok: true };
}

export async function searchUsers(
  query: string,
): Promise<ActionResult<{ id: number; name: string; role: Role; matricNum: string | null }[]>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (typeof query !== "string") return { ok: false, error: "Input tidak sah." };
  const results = await searchUsersForFriend(session.user.id, query);
  return { ok: true, data: results };
}

export async function removeFriend(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = removeFriendSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const friendId = parsed.data.friendId;

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { senderId: me, receiverId: friendId },
        { senderId: friendId, receiverId: me },
      ],
    },
  });

  revalidateFriendSurfaces();
  return { ok: true };
}
