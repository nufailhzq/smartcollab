"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { sendMessageSchema, markReadSchema } from "@/schemas/chat";
import { idSchema, type ActionResult } from "@/schemas/common";
import { getConversation } from "@/server/queries/messages";
import type { Message } from "@prisma/client";

export type ConversationPayload = {
  partner: { id: number; name: string; matricNum: string | null; role: "STUDENT" | "LECTURER" | "ADMIN" };
  messages: { id: number; senderId: number; receiverId: number; content: string; timestamp: string; isRead: boolean }[];
};

export async function sendMessage(raw: unknown): Promise<ActionResult<Message>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = sendMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const me = session.user.id;
  const { receiverId, content } = parsed.data;
  if (me === receiverId) return { ok: false, error: "Tidak boleh menghantar mesej kepada diri sendiri." };

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, isActive: true },
  });
  if (!receiver || !receiver.isActive) return { ok: false, error: "Penerima tidak wujud." };

  const message = await prisma.message.create({
    data: { senderId: me, receiverId, content },
  });

  // Notify the receiver only if they don't already have an unread notif from this sender.
  // (Avoids spam when a long conversation is in progress.)
  await notifyUser(receiverId, {
    title: "Mesej Baharu",
    message: `${session.user.name}: ${content.length > 80 ? content.slice(0, 77) + "..." : content}`,
    link: "chat",
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  return { ok: true, data: message };
}

export async function loadConversation(
  rawPartnerId: unknown,
): Promise<ActionResult<ConversationPayload>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawPartnerId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const partnerId = parsed.data;
  if (partnerId === me) return { ok: false, error: "Tidak boleh membuka perbualan dengan diri sendiri." };

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, matricNum: true, role: true, isActive: true },
  });
  if (!partner || !partner.isActive) return { ok: false, error: "Pengguna tidak wujud." };

  const messagesRaw = await getConversation(me, partnerId, 200);
  // getConversation only returns DMs (receiverId is non-null for those rows),
  // but Prisma types it as nullable since the column also serves chat-group msgs.
  const messages = messagesRaw.filter(
    (m): m is typeof m & { receiverId: number } => m.receiverId !== null,
  );

  const updated = await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: me, isRead: false },
    data: { isRead: true },
  });
  if (updated.count > 0) {
    revalidatePath("/student");
    revalidatePath("/lecturer");
  }

  return {
    ok: true,
    data: {
      partner: {
        id: partner.id,
        name: partner.name,
        matricNum: partner.matricNum,
        role: partner.role,
      },
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        isRead: m.isRead,
      })),
    },
  };
}

export async function markMessagesRead(raw: unknown): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = markReadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const result = await prisma.message.updateMany({
    where: { senderId: parsed.data.fromUserId, receiverId: me, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  return { ok: true, data: { count: result.count } };
}
