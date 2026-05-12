"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markNotificationReadSchema } from "@/schemas/notification";
import type { ActionResult } from "@/schemas/common";

export async function markNotificationRead(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = markNotificationReadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const result = await prisma.notification.updateMany({
    where: { id: parsed.data.id, userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  if (result.count === 0) {
    return { ok: false, error: "Notifikasi tidak wujud atau sudah dibaca." };
  }

  revalidatePath("/student");
  revalidatePath("/lecturer");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const result = await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  return { ok: true, data: { count: result.count } };
}
