"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/schemas/common";

/**
 * Flip the master notification mute. When ON the notification bell hides
 * its badge, the in-app toast is silenced, and the MessageStream sound is
 * skipped. Notification rows are still written so the user can see history
 * after unmuting.
 */
export async function toggleAllNotifications(
  desired?: boolean,
): Promise<ActionResult<{ muted: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationsMuted: true },
  });
  if (!current) return { ok: false, error: "Pengguna tidak wujud." };

  const next =
    typeof desired === "boolean" ? desired : !current.notificationsMuted;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationsMuted: next },
  });

  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/admin");
  revalidatePath("/student/profil");
  revalidatePath("/lecturer/profil");
  return { ok: true, data: { muted: next } };
}
