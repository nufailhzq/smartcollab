"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackAccessSchema, type TrackAccessInput } from "@/schemas/recent-access";

const RING_BUFFER_SIZE = 20;

export async function trackAccess(input: TrackAccessInput): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session) return { ok: false };

  const parsed = trackAccessSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const userId = session.user.id;

  try {
    // findFirst+update/create instead of upsert because Prisma's compound-unique
    // typing rejects null on a nullable key field.
    const existing = await prisma.recentAccess.findFirst({
      where: { userId, type: parsed.data.type, refId: parsed.data.refId },
      select: { id: true },
    });
    if (existing) {
      await prisma.recentAccess.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          link: parsed.data.link,
          accessedAt: new Date(),
        },
      });
    } else {
      await prisma.recentAccess.create({
        data: {
          userId,
          type: parsed.data.type,
          refId: parsed.data.refId,
          title: parsed.data.title,
          link: parsed.data.link,
        },
      });
    }

    // Cap ring buffer: keep only the N most recent for this user.
    const count = await prisma.recentAccess.count({ where: { userId } });
    if (count > RING_BUFFER_SIZE) {
      const stale = await prisma.recentAccess.findMany({
        where: { userId },
        orderBy: { accessedAt: "desc" },
        skip: RING_BUFFER_SIZE,
        select: { id: true },
      });
      if (stale.length > 0) {
        await prisma.recentAccess.deleteMany({
          where: { id: { in: stale.map((s) => s.id) } },
        });
      }
    }
  } catch (err) {
    // Tracking failures must never break the page render.
    console.error("trackAccess failed:", err);
    return { ok: false };
  }

  return { ok: true };
}
