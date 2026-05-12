import { prisma } from "@/lib/prisma";

export async function getGroupsForStudentInCourse(studentId: number, courseId: number) {
  const groups = await prisma.projectGroup.findMany({
    where: { courseId },
    include: {
      members: { include: { student: { select: { id: true, name: true, matricNum: true } } } },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  return groups.map((g) => {
    const isMember = g.members.some((m) => m.studentId === studentId);
    return {
      ...g,
      isCurrentStudentMember: isMember,
      hasCapacity: g._count.members < g.maxMembers,
    };
  });
}

export async function getCurrentGroupForStudent(studentId: number, courseId: number) {
  return prisma.projectGroup.findFirst({
    where: {
      courseId,
      members: { some: { studentId } },
    },
    include: {
      members: {
        include: { student: { select: { id: true, name: true, matricNum: true } } },
        orderBy: { role: "asc" },
      },
    },
  });
}

/**
 * Returns the student's current group (with member contribution + activity proxies)
 * AND every other group in the course (with member previews) so the student can
 * browse "Kumpulan Lain". Activity is computed from the most recent message
 * sent by each member; contribution = (submitted+graded+late)/totalAssignments
 * for that course.
 */
export async function getKumpulanContext(studentId: number, courseId: number) {
  const [course, groups, totalAssignmentsCount, latestMessageRows, courseSubmissions, pendingMine] =
    await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, code: true, title: true, groupsLocked: true },
      }),
      prisma.projectGroup.findMany({
        where: { courseId },
        include: {
          members: {
            include: { student: { select: { id: true, name: true, matricNum: true } } },
            orderBy: { role: "asc" },
          },
          _count: { select: { members: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.assignment.count({ where: { courseId } }),
      prisma.message.groupBy({
        by: ["senderId"],
        _max: { timestamp: true },
      }),
      prisma.submission.findMany({
        where: { assignment: { courseId } },
        select: { studentId: true, status: true },
      }),
      prisma.groupAccessRequest.findMany({
        where: { studentId, courseId, status: "PENDING" },
        include: { group: { select: { id: true, name: true } } },
      }),
    ]);

  const lastBySender = new Map<number, Date>();
  for (const r of latestMessageRows) {
    if (r._max.timestamp) lastBySender.set(r.senderId, r._max.timestamp);
  }

  const submittedByStudent = new Map<number, number>();
  for (const s of courseSubmissions) {
    if (s.status === "SUBMITTED" || s.status === "GRADED" || s.status === "LATE") {
      submittedByStudent.set(s.studentId, (submittedByStudent.get(s.studentId) ?? 0) + 1);
    }
  }

  const enrich = (member: {
    studentId: number;
    role: "LEADER" | "MEMBER";
    student: { id: number; name: string; matricNum: string | null };
  }) => {
    const submitted = submittedByStudent.get(member.studentId) ?? 0;
    const contributionPct =
      totalAssignmentsCount > 0
        ? Math.round((submitted / totalAssignmentsCount) * 100)
        : 0;
    return {
      studentId: member.studentId,
      name: member.student.name,
      matricNum: member.student.matricNum,
      role: member.role,
      contributionPct,
      lastActivityAt: lastBySender.get(member.studentId) ?? null,
    };
  };

  let currentGroup: {
    id: number;
    name: string;
    maxMembers: number;
    memberCount: number;
    members: ReturnType<typeof enrich>[];
  } | null = null;
  const otherGroups: typeof groups = [];

  for (const g of groups) {
    if (g.members.some((m) => m.studentId === studentId)) {
      currentGroup = {
        id: g.id,
        name: g.name,
        maxMembers: g.maxMembers,
        memberCount: g._count.members,
        members: g.members.map(enrich),
      };
    } else {
      otherGroups.push(g);
    }
  }

  return {
    course: {
      id: course?.id ?? courseId,
      code: course?.code ?? "",
      title: course?.title ?? "",
      groupsLocked: course?.groupsLocked ?? false,
    },
    currentGroup,
    otherGroups: otherGroups.map((g) => ({
      id: g.id,
      name: g.name,
      maxMembers: g.maxMembers,
      memberCount: g._count.members,
      hasCapacity: g._count.members < g.maxMembers,
      memberPreviews: g.members.slice(0, 4).map((m) => ({
        id: m.student.id,
        name: m.student.name,
        matricNum: m.student.matricNum,
      })),
    })),
    pendingRequests: pendingMine.map((r) => ({
      id: r.id,
      type: r.type as "JOIN" | "LEAVE",
      groupId: r.groupId,
      groupName: r.group.name,
    })),
  };
}
