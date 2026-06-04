"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { saveChatAttachment } from "@/lib/chat-uploads";
import {
  ATTACHMENT_TYPES,
  sendMessageSchema,
  markReadSchema,
  type AttachmentType,
} from "@/schemas/chat";
import { idSchema, type ActionResult } from "@/schemas/common";
import { getConversation } from "@/server/queries/messages";
import type { Message } from "@prisma/client";

/**
 * Where the conversation sits in the chat-request handshake.
 * - "open" — friends, classmates, or an accepted request: full chat allowed.
 * - "incoming-pending" — the viewer received the first message and hasn't
 *   accepted yet. They see the messages but can't reply until they accept.
 * - "outgoing-pending" — the viewer sent the first message and the partner
 *   hasn't accepted yet. They can keep adding messages but the recipient sees
 *   it as a request.
 */
export type RequestStatus = "open" | "incoming-pending" | "outgoing-pending";

export type ConversationPayload = {
  partner: { id: number; name: string; matricNum: string | null; role: "STUDENT" | "LECTURER" | "ADMIN" };
  requestStatus: RequestStatus;
  messages: {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
    attachmentPath: string | null;
    attachmentType: string | null;
    attachmentName: string | null;
    attachmentSize: string | null;
  }[];
};

/**
 * Pairs that bypass the request handshake: friends, course classmates, or any
 * pair with at least one ACCEPTED MessageRequest in either direction.
 */
async function isChatOpen(userA: number, userB: number): Promise<boolean> {
  // Accepted friendship?
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    },
    select: { id: true },
  });
  if (friendship) return true;

  // Existing course relationship (student↔lecturer of same course, or two
  // students enrolled in the same course)?
  const overlap = await prisma.course.findFirst({
    where: {
      OR: [
        { lecturerId: userA, enrollments: { some: { studentId: userB } } },
        { lecturerId: userB, enrollments: { some: { studentId: userA } } },
        {
          AND: [
            { enrollments: { some: { studentId: userA } } },
            { enrollments: { some: { studentId: userB } } },
          ],
        },
      ],
    },
    select: { id: true },
  });
  if (overlap) return true;

  // Previously accepted message request (either direction)?
  const accepted = await prisma.messageRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    },
    select: { id: true },
  });
  return accepted !== null;
}

function attachmentPreview(content: string, type: AttachmentType | null): string {
  if (content && content.length > 0) {
    return content.length > 80 ? content.slice(0, 77) + "..." : content;
  }
  if (type === "image") return "📷 Imej";
  if (type === "video") return "🎬 Video";
  if (type === "file") return "📎 Fail";
  return "";
}

export async function sendMessage(formData: FormData): Promise<ActionResult<Message>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const receiverIdParsed = idSchema.safeParse(formData.get("receiverId"));
  if (!receiverIdParsed.success) return { ok: false, error: "Penerima tidak sah." };

  const parsed = sendMessageSchema.safeParse({
    receiverId: receiverIdParsed.data,
    content: String(formData.get("content") ?? ""),
  });
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

  // Optional attachment
  const file = formData.get("attachment");
  const declared = String(formData.get("attachmentType") ?? "");
  let attachmentPath: string | null = null;
  let attachmentType: AttachmentType | null = null;
  let attachmentName: string | null = null;
  let attachmentSize: string | null = null;

  if (file instanceof File && file.size > 0) {
    const type: AttachmentType = (ATTACHMENT_TYPES as readonly string[]).includes(declared)
      ? (declared as AttachmentType)
      : "file";
    const saved = await saveChatAttachment(file, type);
    if (!saved.ok) return { ok: false, error: saved.error };
    attachmentPath = saved.data.path;
    attachmentType = saved.data.type;
    attachmentName = saved.data.name;
    attachmentSize = saved.data.size;
  }

  if (!content && !attachmentPath) {
    return { ok: false, error: "Mesej kosong." };
  }

  // Chat-request gate. If the pair has no existing relationship (friend,
  // classmate, or accepted request), the first message creates a PENDING
  // MessageRequest. The viewer can keep adding messages while pending, but
  // a request initiated AGAINST the viewer must be accepted before they
  // can reply.
  const open = await isChatOpen(me, receiverId);
  let isFreshRequest = false;
  if (!open) {
    const incoming = await prisma.messageRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: me } },
    });
    if (incoming && incoming.status === "PENDING") {
      // The other party messaged us first — we have to accept before replying.
      return {
        ok: false,
        error:
          "Anda perlu menerima permintaan chat ini sebelum boleh membalas.",
      };
    }
    const existing = await prisma.messageRequest.findUnique({
      where: { senderId_receiverId: { senderId: me, receiverId } },
    });
    if (!existing) {
      await prisma.messageRequest.create({
        data: { senderId: me, receiverId, status: "PENDING" },
      });
      isFreshRequest = true;
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId: me,
      receiverId,
      content,
      attachmentPath,
      attachmentType,
      attachmentName,
      attachmentSize,
    },
  });

  await notifyUser(receiverId, {
    title: isFreshRequest ? "Permintaan Chat" : "Mesej Baharu",
    message: `${session.user.name}: ${attachmentPreview(content, attachmentType)}`,
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

  // Resolve the request-status snapshot.
  let requestStatus: RequestStatus = "open";
  if (!(await isChatOpen(me, partnerId))) {
    // Either direction may have an open request row.
    const [outgoing, incoming] = await Promise.all([
      prisma.messageRequest.findUnique({
        where: { senderId_receiverId: { senderId: me, receiverId: partnerId } },
      }),
      prisma.messageRequest.findUnique({
        where: { senderId_receiverId: { senderId: partnerId, receiverId: me } },
      }),
    ]);
    if (incoming && incoming.status === "PENDING") requestStatus = "incoming-pending";
    else if (outgoing && outgoing.status === "PENDING") requestStatus = "outgoing-pending";
  }

  // Only mark messages read once the viewer has accepted (or never needed to).
  if (requestStatus !== "incoming-pending") {
    const updated = await prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: me, isRead: false },
      data: { isRead: true },
    });
    if (updated.count > 0) {
      revalidatePath("/student");
      revalidatePath("/lecturer");
    }
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
      requestStatus,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        isRead: m.isRead,
        attachmentPath: m.attachmentPath,
        attachmentType: m.attachmentType,
        attachmentName: m.attachmentName,
        attachmentSize: m.attachmentSize,
      })),
    },
  };
}

/**
 * Accept an incoming chat request — flips the row to ACCEPTED so future
 * messages flow normally. Idempotent: succeeds even if already accepted.
 */
export async function acceptChatRequest(
  rawSenderId: unknown,
): Promise<ActionResult<{ partnerId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawSenderId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const senderId = parsed.data;

  const request = await prisma.messageRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId: me } },
  });
  if (!request) return { ok: false, error: "Permintaan tidak wujud." };

  if (request.status !== "ACCEPTED") {
    await prisma.messageRequest.update({
      where: { id: request.id },
      data: { status: "ACCEPTED" },
    });
    await notifyUser(senderId, {
      title: "Permintaan Chat Diterima",
      message: `${session.user.name} menerima permintaan chat anda.`,
      link: "chat",
    });
  }

  // Mark the seed messages as read now that the chat is officially open.
  await prisma.message.updateMany({
    where: { senderId, receiverId: me, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  return { ok: true, data: { partnerId: senderId } };
}

/**
 * Reject an incoming chat request — deletes the request row and removes
 * every DM the requester ever sent the viewer so the inbox stays clean.
 */
export async function rejectChatRequest(
  rawSenderId: unknown,
): Promise<ActionResult<{ partnerId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = idSchema.safeParse(rawSenderId);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const me = session.user.id;
  const senderId = parsed.data;

  const request = await prisma.messageRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId: me } },
  });
  if (!request) return { ok: false, error: "Permintaan tidak wujud." };
  if (request.status === "ACCEPTED") {
    return { ok: false, error: "Permintaan ini telah diterima." };
  }

  await prisma.$transaction([
    prisma.message.deleteMany({
      where: { senderId, receiverId: me },
    }),
    prisma.messageRequest.delete({ where: { id: request.id } }),
  ]);

  revalidatePath("/student");
  revalidatePath("/lecturer");
  return { ok: true, data: { partnerId: senderId } };
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
