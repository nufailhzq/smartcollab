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

export type FriendSuggestion = {
  id: number;
  name: string;
  role: "STUDENT" | "LECTURER";
  matricNum: string | null;
  faculty: string | null;
  program: string | null;
  avatarPath: string | null;
  sharedFaculty: boolean;
  sharedProgram: boolean;
};

/**
 * Friend suggestions for the navbar search bar.
 * Excludes self + anyone already in a friendship row (any status — pending or
 * accepted). Prefers same program, then same faculty, then alphabetical.
 */
export async function getFriendSuggestions(
  take = 8,
  excludeIds: number[] = [],
): Promise<ActionResult<FriendSuggestion[]>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const me = session.user.id;
  const limit = Math.max(1, Math.min(take, 20));

  const viewer = await prisma.user.findUnique({
    where: { id: me },
    select: { faculty: true, program: true },
  });

  // IDs the viewer already has any friendship row with (pending or accepted).
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    select: { senderId: true, receiverId: true },
  });
  const excludedIds = new Set<number>([me, ...excludeIds]);
  for (const f of friendships) {
    excludedIds.add(f.senderId === me ? f.receiverId : f.senderId);
  }

  // Pull a generous pool so we can rank by shared faculty/program client-side.
  const pool = await prisma.user.findMany({
    where: {
      role: { in: ["STUDENT", "LECTURER"] },
      isActive: true,
      id: { notIn: Array.from(excludedIds) },
    },
    select: {
      id: true,
      name: true,
      role: true,
      matricNum: true,
      faculty: true,
      program: true,
      avatarPath: true,
    },
    take: limit * 4,
  });

  const ranked = pool
    .map((u) => {
      const sharedFaculty = !!viewer?.faculty && u.faculty === viewer.faculty;
      const sharedProgram = !!viewer?.program && u.program === viewer.program;
      // Light lecturer bonus so a few teaching staff surface alongside peers.
      const score =
        (sharedProgram ? 2 : 0) +
        (sharedFaculty ? 1 : 0) +
        (u.role === "LECTURER" ? 1 : 0);
      return {
        ...u,
        role: u.role as "STUDENT" | "LECTURER",
        sharedFaculty,
        sharedProgram,
        _score: score,
      };
    })
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest);

  return { ok: true, data: ranked };
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
