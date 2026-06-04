import { prisma } from "@/lib/prisma";

export async function getActiveBulletins(limit = 5) {
  return prisma.bulletin.findMany({
    where: { isActive: true },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getAllBulletins() {
  return prisma.bulletin.findMany({
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export type ActiveBulletin = Awaited<ReturnType<typeof getActiveBulletins>>[number];
