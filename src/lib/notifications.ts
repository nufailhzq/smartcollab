import { prisma } from "./prisma";
import { emitRefresh } from "./message-events";

export type NotificationPayload = {
  title: string;
  message: string;
  link?: string;
};

export async function notifyUser(userId: number, n: NotificationPayload) {
  const created = await prisma.notification.create({
    data: {
      userId,
      title: n.title,
      message: n.message,
      link: n.link ?? "",
    },
  });
  // Live: nudge the recipient's open tabs to re-fetch (bell + page data).
  emitRefresh(userId, "notification");
  return created;
}

export async function notifyMany(userIds: number[], n: NotificationPayload) {
  if (userIds.length === 0) return { count: 0 };
  const result = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: n.title,
      message: n.message,
      link: n.link ?? "",
    })),
  });
  emitRefresh(userIds, "notification");
  return result;
}

export async function notifyEnrolledStudents(
  courseId: number,
  n: NotificationPayload,
  excludeUserId?: number,
) {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      courseId,
      ...(excludeUserId ? { studentId: { not: excludeUserId } } : {}),
    },
    select: { studentId: true },
  });
  return notifyMany(
    enrollments.map((e) => e.studentId),
    n,
  );
}

export async function notifyGroupMembers(
  groupId: number,
  n: NotificationPayload,
  excludeUserId?: number,
) {
  const members = await prisma.groupMember.findMany({
    where: {
      groupId,
      ...(excludeUserId ? { studentId: { not: excludeUserId } } : {}),
    },
    select: { studentId: true },
  });
  return notifyMany(
    members.map((m) => m.studentId),
    n,
  );
}

/**
 * Notify every active STUDENT and LECTURER. Used by org-wide announcements
 * like bulletins. Admins are skipped — they typically authored the announcement.
 */
export async function notifyAllStudentsAndLecturers(
  n: NotificationPayload,
  excludeUserId?: number,
) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["STUDENT", "LECTURER"] },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  return notifyMany(
    users.map((u) => u.id),
    n,
  );
}
