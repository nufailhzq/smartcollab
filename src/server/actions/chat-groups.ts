"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/notifications";
import {
  addChatGroupMemberSchema,
  createChatGroupSchema,
  leaveChatGroupSchema,
  removeChatGroupMemberSchema,
  renameChatGroupSchema,
  sendChatGroupMessageSchema,
} from "@/schemas/chat-group";
import type { ActionResult } from "@/schemas/common";
import type { Message } from "@prisma/client";

async function ensureMember(chatGroupId: number, userId: number) {
  return prisma.chatGroupMember.findUnique({
    where: { chatGroupId_userId: { chatGroupId, userId } },
  });
}

export async function createChatGroup(
  raw: unknown,
): Promise<ActionResult<{ id: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = createChatGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const creatorId = session.user.id;
  const memberIds = Array.from(new Set([creatorId, ...parsed.data.memberIds]));

  // Verify every other member is an active user
  const members = await prisma.user.findMany({
    where: { id: { in: memberIds }, isActive: true },
    select: { id: true },
  });
  if (members.length !== memberIds.length) {
    return { ok: false, error: "Salah satu ahli tidak wujud." };
  }
  if (memberIds.length < 2) {
    return { ok: false, error: "Kumpulan chat memerlukan sekurang-kurangnya 2 ahli." };
  }

  const group = await prisma.chatGroup.create({
    data: {
      name: parsed.data.name,
      createdById: creatorId,
      members: {
        create: memberIds.map((uid) => ({
          userId: uid,
          isAdmin: uid === creatorId,
        })),
      },
    },
    select: { id: true },
  });

  // Notify everyone except creator
  await notifyMany(
    memberIds.filter((id) => id !== creatorId),
    {
      title: "Kumpulan Chat Baharu",
      message: `${session.user.name} menambah anda ke "${parsed.data.name}".`,
      link: "chat",
    },
  );

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  return { ok: true, data: { id: group.id } };
}

export async function addChatGroupMember(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = addChatGroupMemberSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const meMember = await ensureMember(parsed.data.chatGroupId, me);
  if (!meMember) {
    return { ok: false, error: "Anda bukan ahli kumpulan chat ini." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, isActive: true, name: true },
  });
  if (!target || !target.isActive) {
    return { ok: false, error: "Pengguna tidak wujud." };
  }

  const existing = await ensureMember(parsed.data.chatGroupId, parsed.data.userId);
  if (existing) return { ok: false, error: "Pengguna sudah dalam kumpulan ini." };

  const group = await prisma.chatGroup.findUnique({
    where: { id: parsed.data.chatGroupId },
    select: { name: true },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };

  await prisma.chatGroupMember.create({
    data: {
      chatGroupId: parsed.data.chatGroupId,
      userId: parsed.data.userId,
    },
  });

  await notifyMany([parsed.data.userId], {
    title: "Ditambah ke Kumpulan Chat",
    message: `${session.user.name} menambah anda ke "${group.name}".`,
    link: "chat",
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  return { ok: true };
}

export async function removeChatGroupMember(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = removeChatGroupMemberSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const meMember = await ensureMember(parsed.data.chatGroupId, me);
  if (!meMember || !meMember.isAdmin) {
    return { ok: false, error: "Hanya admin kumpulan boleh mengeluarkan ahli." };
  }
  if (parsed.data.userId === me) {
    return { ok: false, error: "Gunakan 'Keluar Kumpulan' untuk diri sendiri." };
  }

  await prisma.chatGroupMember.deleteMany({
    where: { chatGroupId: parsed.data.chatGroupId, userId: parsed.data.userId },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  return { ok: true };
}

export async function leaveChatGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = leaveChatGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const meMember = await ensureMember(parsed.data.chatGroupId, me);
  if (!meMember) return { ok: false, error: "Anda bukan ahli kumpulan ini." };

  await prisma.$transaction(async (tx) => {
    await tx.chatGroupMember.delete({ where: { id: meMember.id } });

    const remaining = await tx.chatGroupMember.count({
      where: { chatGroupId: parsed.data.chatGroupId },
    });
    if (remaining === 0) {
      // Last member out — delete the group.
      await tx.chatGroup.delete({ where: { id: parsed.data.chatGroupId } });
      return;
    }

    // If the leaver was the only admin, promote the oldest remaining member to admin.
    if (meMember.isAdmin) {
      const adminCount = await tx.chatGroupMember.count({
        where: { chatGroupId: parsed.data.chatGroupId, isAdmin: true },
      });
      if (adminCount === 0) {
        const next = await tx.chatGroupMember.findFirst({
          where: { chatGroupId: parsed.data.chatGroupId },
          orderBy: { joinedAt: "asc" },
        });
        if (next) {
          await tx.chatGroupMember.update({
            where: { id: next.id },
            data: { isAdmin: true },
          });
        }
      }
    }
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  return { ok: true };
}

export async function renameChatGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = renameChatGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const meMember = await ensureMember(parsed.data.chatGroupId, session.user.id);
  if (!meMember || !meMember.isAdmin) {
    return { ok: false, error: "Hanya admin kumpulan boleh menukar nama." };
  }

  await prisma.chatGroup.update({
    where: { id: parsed.data.chatGroupId },
    data: { name: parsed.data.name },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  return { ok: true };
}

export async function sendChatGroupMessage(
  raw: unknown,
): Promise<ActionResult<Message>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = sendChatGroupMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const me = session.user.id;
  const meMember = await ensureMember(parsed.data.chatGroupId, me);
  if (!meMember) return { ok: false, error: "Anda bukan ahli kumpulan ini." };

  const message = await prisma.message.create({
    data: {
      senderId: me,
      chatGroupId: parsed.data.chatGroupId,
      content: parsed.data.content,
    },
  });

  // Update sender's lastReadAt so their own unread count stays at 0.
  await prisma.chatGroupMember.update({
    where: { id: meMember.id },
    data: { lastReadAt: new Date() },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  return { ok: true, data: message };
}

export type ChatGroupConversationPayload = {
  group: {
    id: number;
    name: string;
    isAdmin: boolean;
    members: { id: number; name: string; matricNum: string | null; role: "STUDENT" | "LECTURER" | "ADMIN"; isAdmin: boolean }[];
  };
  messages: {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    timestamp: string;
  }[];
};

export async function loadChatGroupConversation(
  rawGroupId: unknown,
): Promise<ActionResult<ChatGroupConversationPayload>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const id = Number(rawGroupId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Input tidak sah." };
  }

  const me = session.user.id;
  const myMembership = await ensureMember(id, me);
  if (!myMembership) {
    return { ok: false, error: "Anda bukan ahli kumpulan ini." };
  }

  const group = await prisma.chatGroup.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, matricNum: true, role: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };

  const messages = await prisma.message.findMany({
    where: { chatGroupId: id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { timestamp: "asc" },
    take: 300,
  });

  // Mark read
  await prisma.chatGroupMember.update({
    where: { id: myMembership.id },
    data: { lastReadAt: new Date() },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");

  return {
    ok: true,
    data: {
      group: {
        id: group.id,
        name: group.name,
        isAdmin: myMembership.isAdmin,
        members: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          matricNum: m.user.matricNum,
          role: m.user.role,
          isAdmin: m.isAdmin,
        })),
      },
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
    },
  };
}
