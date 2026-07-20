import { prisma } from "@/lib/prisma";

/**
 * For the "Request group" form: classmates in the course who are not already in
 * a standing group (PENDING/APPROVED), plus the requesting student's own
 * standing-group status (so the UI can show a Pending/Approved/Rejected badge).
 */
export async function getRequestGroupContext(studentId: number, courseId: number) {
  const [course, enrollments, takenMembers, myGroup] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        selfServiceGroups: true,
        groupMaxMembers: true,
        groupFormCloseAt: true,
      },
    }),
    prisma.classEnrollment.findMany({
      where: { courseId },
      select: { student: { select: { id: true, name: true, matricNum: true } } },
    }),
    prisma.groupMember.findMany({
      where: {
        group: { courseId, assignmentId: null, status: { in: ["PENDING", "APPROVED"] } },
      },
      select: { studentId: true },
    }),
    prisma.projectGroup.findFirst({
      where: {
        courseId,
        assignmentId: null,
        status: { in: ["PENDING", "APPROVED", "REJECTED"] },
        members: { some: { studentId } },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, status: true },
    }),
  ]);

  const taken = new Set(takenMembers.map((m) => m.studentId));
  const eligibleClassmates = enrollments
    .map((e) => e.student)
    .filter((s) => s.id !== studentId && !taken.has(s.id));

  return {
    eligibleClassmates,
    policy: {
      selfService: course?.selfServiceGroups ?? false,
      maxMembers: course?.groupMaxMembers ?? 5,
      closeAt: course?.groupFormCloseAt ?? null,
      formationClosed: course?.groupFormCloseAt
        ? new Date() > course.groupFormCloseAt
        : false,
    },
    myGroup: myGroup
      ? { id: myGroup.id, name: myGroup.name, status: myGroup.status }
      : null,
  };
}

export async function getGroupsForStudentInCourse(studentId: number, courseId: number) {
  const groups = await prisma.projectGroup.findMany({
    // Standing groups only.
    where: { courseId, assignmentId: null },
    include: {
      members: { include: { student: { select: { id: true, name: true, matricNum: true, avatarPath: true } } } },
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

/**
 * Pending group requests for a course, for the lecturer approval list. Covers
 * BOTH standing groups (assignmentId null) and ad-hoc student-formed groups
 * (CUSTOM mode, assignmentId set) — the latter carry an `assignment` label so
 * the lecturer sees which assignment the request belongs to.
 */
export async function getPendingGroupRequests(courseId: number) {
  const groups = await prisma.projectGroup.findMany({
    where: { courseId, status: "PENDING" },
    include: {
      assignment: { select: { id: true, title: true } },
      members: {
        include: { student: { select: { id: true, name: true, matricNum: true } } },
        orderBy: { role: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    assignment: g.assignment
      ? { id: g.assignment.id, title: g.assignment.title }
      : null,
    members: g.members.map((m) => ({
      id: m.student.id,
      name: m.student.name,
      matricNum: m.student.matricNum,
      role: m.role,
    })),
  }));
}

export async function getCurrentGroupForStudent(studentId: number, courseId: number) {
  return prisma.projectGroup.findFirst({
    where: {
      courseId,
      // Standing group only (assignmentId = null). Ad-hoc per-assignment groups
      // must never surface as the student's "current" course group. Only an
      // APPROVED group is a real membership — a PENDING request isn't yet.
      assignmentId: null,
      status: "APPROVED",
      members: { some: { studentId } },
    },
    include: {
      members: {
        include: { student: { select: { id: true, name: true, matricNum: true, avatarPath: true } } },
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
        // Standing groups only — the "my group / other groups" browser is the
        // course's long-lived grouping, not per-assignment ad-hoc rows. Only
        // APPROVED groups are real memberships: a PENDING request is not "being
        // in a group" (surfaced separately as a pending banner), and REJECTED
        // groups don't exist for the student.
        where: { courseId, assignmentId: null, status: "APPROVED" },
        include: {
          members: {
            include: { student: { select: { id: true, name: true, matricNum: true, avatarPath: true } } },
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
    student: { id: number; name: string; matricNum: string | null; avatarPath: string | null };
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
      avatarPath: member.student.avatarPath ?? null,
      role: member.role,
      contributionPct,
      submitted,
      totalAssignments: totalAssignmentsCount,
      lastActivityAt: lastBySender.get(member.studentId) ?? null,
    };
  };

  // Explicit type configuration introduced to bypass strict 'noUncheckedIndexedAccess' checks
  let currentGroup: {
    id: number;
    name: string;
    maxMembers: number;
    memberCount: number;
    members: {
      studentId: number;
      name: string;
      matricNum: string | null;
      avatarPath: string | null;
      role: "LEADER" | "MEMBER";
      contributionPct: number;
      submitted: number;
      totalAssignments: number;
      lastActivityAt: Date | null;
    }[];
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
        avatarPath: m.student.avatarPath,
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