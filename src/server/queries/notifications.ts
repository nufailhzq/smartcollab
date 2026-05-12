import { prisma } from "@/lib/prisma";

export async function getNotificationsForUser(userId: number, take = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getUnreadNotificationCount(userId: number) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
