import { prisma } from "@/lib/prisma";

export async function getRecentAccess(userId: number, limit = 5) {
  return prisma.recentAccess.findMany({
    where: { userId },
    orderBy: { accessedAt: "desc" },
    take: limit,
  });
}

export type RecentAccessItem = Awaited<ReturnType<typeof getRecentAccess>>[number];
