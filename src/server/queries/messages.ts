import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type Contact = {
  id: number;
  name: string;
  role: Role;
  matricNum: string | null;
  unread: number;
  isFriend: boolean;
  relationship: "friend" | "enrolled-lecturer" | "taught-student" | "dm-history";
  lastMessageAt: Date | null;
};

export async function getContactsForUser(userId: number, userRole: Role): Promise<Contact[]> {
  // 1. Friends (accepted)
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, role: true, matricNum: true } },
      receiver: { select: { id: true, name: true, role: true, matricNum: true } },
    },
  });

  // 2. Lecturers of the user's enrolled courses (if user is a student)
  // 3. Students in the user's taught courses (if user is a lecturer)
  const enrolledLecturerIds: number[] = [];
  const taughtStudentIds: number[] = [];
  if (userRole === "STUDENT") {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      include: { course: { select: { lecturerId: true } } },
    });
    for (const e of enrollments) {
      if (e.course.lecturerId && e.course.lecturerId !== userId) {
        enrolledLecturerIds.push(e.course.lecturerId);
      }
    }
  } else if (userRole === "LECTURER") {
    const taughtCourses = await prisma.course.findMany({
      where: { lecturerId: userId },
      include: { enrollments: { select: { studentId: true } } },
    });
    for (const c of taughtCourses) {
      for (const e of c.enrollments) taughtStudentIds.push(e.studentId);
    }
  }

  // 4. DM history (anyone the user has exchanged messages with) — DMs only,
  // not chat-group messages (those have receiverId = null).
  const dms = await prisma.message.findMany({
    where: {
      receiverId: { not: null },
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true, timestamp: true, isRead: true },
    orderBy: { timestamp: "desc" },
  });
  const dmPartnerIds = new Set<number>();
  const lastByPartner = new Map<number, Date>();
  const unreadByPartner = new Map<number, number>();
  for (const m of dms) {
    if (m.receiverId === null) continue;
    const otherId = m.senderId === userId ? m.receiverId : m.senderId;
    dmPartnerIds.add(otherId);
    if (!lastByPartner.has(otherId)) lastByPartner.set(otherId, m.timestamp);
    if (!m.isRead && m.receiverId === userId) {
      unreadByPartner.set(otherId, (unreadByPartner.get(otherId) ?? 0) + 1);
    }
  }

  // Union all candidate contact IDs
  const friendIds = new Set<number>();
  const friendshipById = new Map<
    number,
    { id: number; name: string; role: Role; matricNum: string | null }
  >();
  for (const f of friendships) {
    const other = f.senderId === userId ? f.receiver : f.sender;
    friendIds.add(other.id);
    friendshipById.set(other.id, other);
  }

  const allIds = new Set<number>([
    ...friendIds,
    ...enrolledLecturerIds,
    ...taughtStudentIds,
    ...dmPartnerIds,
  ]);
  allIds.delete(userId);

  if (allIds.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: [...allIds] } },
    select: { id: true, name: true, role: true, matricNum: true },
  });

  const result: Contact[] = users.map((u) => {
    const isFriend = friendIds.has(u.id);
    let relationship: Contact["relationship"] = "dm-history";
    if (isFriend) relationship = "friend";
    else if (enrolledLecturerIds.includes(u.id)) relationship = "enrolled-lecturer";
    else if (taughtStudentIds.includes(u.id)) relationship = "taught-student";
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      matricNum: u.matricNum,
      unread: unreadByPartner.get(u.id) ?? 0,
      isFriend,
      relationship,
      lastMessageAt: lastByPartner.get(u.id) ?? null,
    };
  });

  // Sort: unread first, then by recency, then by name
  result.sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread;
    if (a.lastMessageAt && b.lastMessageAt) {
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    }
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export async function getConversation(userA: number, userB: number, take = 100) {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    },
    orderBy: { timestamp: "asc" },
    take,
  });
}

export async function getTotalUnreadForUser(userId: number) {
  const [dms, chatGroups] = await Promise.all([
    prisma.message.count({ where: { receiverId: userId, isRead: false } }),
    getChatGroupsForUser(userId).then((list) =>
      list.reduce((acc, g) => acc + g.unread, 0),
    ),
  ]);
  return dms + chatGroups;
}

export type ChatGroupSummary = {
  id: number;
  name: string;
  memberCount: number;
  unread: number;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastSenderName: string | null;
  isAdmin: boolean;
};

export async function getChatGroupsForUser(userId: number): Promise<ChatGroupSummary[]> {
  const memberships = await prisma.chatGroupMember.findMany({
    where: { userId },
    include: {
      chatGroup: {
        include: {
          _count: { select: { members: true } },
          messages: {
            orderBy: { timestamp: "desc" },
            take: 1,
            select: {
              content: true,
              timestamp: true,
              sender: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  // Compute unread per group: messages newer than membership.lastReadAt
  // (excluding own messages).
  const groupIds = memberships.map((m) => m.chatGroupId);
  const unreadRows =
    groupIds.length === 0
      ? []
      : await prisma.message.groupBy({
          by: ["chatGroupId"],
          where: {
            chatGroupId: { in: groupIds },
            senderId: { not: userId },
            OR: memberships.map((m) => ({
              chatGroupId: m.chatGroupId,
              timestamp: { gt: m.lastReadAt },
            })),
          },
          _count: { _all: true },
        });
  const unreadByGroup = new Map<number, number>();
  for (const r of unreadRows) {
    if (r.chatGroupId !== null) unreadByGroup.set(r.chatGroupId, r._count._all);
  }

  const summaries = memberships.map<ChatGroupSummary>((m) => {
    const last = m.chatGroup.messages[0] ?? null;
    return {
      id: m.chatGroupId,
      name: m.chatGroup.name,
      memberCount: m.chatGroup._count.members,
      unread: unreadByGroup.get(m.chatGroupId) ?? 0,
      lastMessageAt: last ? last.timestamp : null,
      lastMessagePreview: last ? last.content : null,
      lastSenderName: last ? last.sender.name : null,
      isAdmin: m.isAdmin,
    };
  });

  summaries.sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread;
    if (a.lastMessageAt && b.lastMessageAt) {
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    }
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.name.localeCompare(b.name);
  });

  return summaries;
}

export async function getPendingFriendRequests(userId: number) {
  return prisma.friendship.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: { sender: { select: { id: true, name: true, role: true, matricNum: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function searchUsersForFriend(userId: number, query: string) {
  if (query.trim().length < 2) return [];
  const q = query.trim();
  return prisma.user.findMany({
    where: {
      id: { not: userId },
      isActive: true,
      OR: [
        { name: { contains: q } },
        { matricNum: { contains: q } },
      ],
    },
    select: { id: true, name: true, role: true, matricNum: true },
    take: 10,
  });
}
