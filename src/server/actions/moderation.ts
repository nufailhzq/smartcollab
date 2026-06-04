"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { idSchema, type ActionResult } from "@/schemas/common";

function revalidate() {
  revalidatePath("/student");
  revalidatePath("/lecturer");
}

export async function blockUser(rawTargetId: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawTargetId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const targetId = parsed.data;
  if (targetId === me) {
    return { ok: false, error: "Tidak boleh blok diri sendiri." };
  }

  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: me, blockedId: targetId } },
    create: { blockerId: me, blockedId: targetId },
    update: {},
  });

  revalidate();
  return { ok: true };
}

export async function unblockUser(rawTargetId: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawTargetId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  await prisma.userBlock.deleteMany({
    where: { blockerId: session.user.id, blockedId: parsed.data },
  });

  revalidate();
  return { ok: true };
}

export async function muteUser(rawTargetId: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawTargetId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const targetId = parsed.data;
  if (targetId === me) return { ok: false, error: "Tidak boleh mute diri sendiri." };

  await prisma.userMute.upsert({
    where: { muterId_mutedId: { muterId: me, mutedId: targetId } },
    create: { muterId: me, mutedId: targetId },
    update: {},
  });

  revalidate();
  return { ok: true };
}

export async function unmuteUser(rawTargetId: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawTargetId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  await prisma.userMute.deleteMany({
    where: { muterId: session.user.id, mutedId: parsed.data },
  });

  revalidate();
  return { ok: true };
}

export type ModerationState = {
  blocked: boolean;
  blockedMe: boolean;
  muted: boolean;
};

export async function getModerationState(
  rawTargetId: unknown,
): Promise<ActionResult<ModerationState>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawTargetId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const targetId = parsed.data;

  const [outBlock, inBlock, muted] = await Promise.all([
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: me, blockedId: targetId } },
    }),
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: targetId, blockedId: me } },
    }),
    prisma.userMute.findUnique({
      where: { muterId_mutedId: { muterId: me, mutedId: targetId } },
    }),
  ]);

  return {
    ok: true,
    data: {
      blocked: outBlock !== null,
      blockedMe: inBlock !== null,
      muted: muted !== null,
    },
  };
}
