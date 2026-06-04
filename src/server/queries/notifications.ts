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

const WARNING_LINK_TAG = "warning";

/** Unread inactivity warnings from lecturers — shown prominently on student dashboard. */
export async function getActiveWarningsForUser(userId: number, take = 5) {
  return prisma.notification.findMany({
    where: { userId, link: WARNING_LINK_TAG, isRead: false },
    orderBy: { createdAt: "desc" },
    take,
  });
}
