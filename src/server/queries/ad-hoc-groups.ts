import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { NonInvitableReason, PoolStudent } from "@/schemas/ad-hoc-group";

// ─────────────────────────────────────────────────────────────────────────────
// Read model for the shared Groups board (Stage 3). One query shape serves both
// the student and lecturer variants; the page decides what to render.
//
// Standing/ad-hoc isolation: every read here filters group.assignmentId =
// <this assignment>, so standing groups (assignmentId null) never appear.
// ─────────────────────────────────────────────────────────────────────────────

export type BoardMember = {
  id: number;
  name: string;
  matricNum: string | null;
  avatarPath: string | null;
  role: "LEADER" | "MEMBER";
};

export type BoardGroup = {
  id: number;
  name: string;
  maxMembers: number;
  members: BoardMember[];
  isMine: boolean;
};

export type BoardPendingInvite = {
  id: number;
  groupId: number;
  groupName: string;
  inviterName: string;
  // True when the invite was sent TO the viewer (they accept/decline).
  // False when the viewer's group sent it (they can cancel it).
  incoming: boolean;
  inviteeName: string;
};

export type AdHocBoard = {
  assignmentId: number;
  courseCode: string;
  groupingMode: "INHERIT" | "CUSTOM" | "RANDOM" | "INDIVIDUAL";
  cap: number;
  groups: BoardGroup[];
  ungrouped: PoolStudent[];
  // Student-only context. For lecturers these are empty/null.
  myGroupId: number | null;
  myPendingInvites: BoardPendingInvite[];
  // The pool split so a group member can invite — reuses the same reason tags
  // as listInvitablePool so the board and the action agree.
  invitable: PoolStudent[];
  nonInvitable: { student: PoolStudent; reason: NonInvitableReason }[];
};

/**
 * Build the board for one assignment. `viewerId`/`role` tailor the student-only
 * fields (own group, pending invites, invitable pool). Returns null if the
 * assignment doesn't exist or the viewer has no access (not enrolled / not the
 * owning lecturer).
 */
export async function getAdHocBoard(
  assignmentId: number,
  viewerId: number,
  role: Role,
): Promise<AdHocBoard | null> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      groupingMode: true,
      course: {
        select: {
          id: true,
          code: true,
          lecturerId: true,
          enrollments: { where: { studentId: viewerId }, select: { id: true } },
        },
      },
    },
  });
  if (!assignment) return null;

  const isLecturerOwner = role === "LECTURER" && assignment.course.lecturerId === viewerId;
  const isAdmin = role === "ADMIN";
  const isEnrolledStudent = role === "STUDENT" && assignment.course.enrollments.length > 0;
  if (!isLecturerOwner && !isAdmin && !isEnrolledStudent) return null;

  const [groupRows, roster, pendingInvites] = await Promise.all([
    prisma.projectGroup.findMany({
      where: { assignmentId: assignment.id },
      select: {
        id: true,
        name: true,
        maxMembers: true,
        members: {
          select: {
            role: true,
            student: {
              select: { id: true, name: true, matricNum: true, avatarPath: true },
            },
          },
          orderBy: { role: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.classEnrollment.findMany({
      where: { courseId: assignment.course.id },
      select: {
        student: { select: { id: true, name: true, matricNum: true, avatarPath: true } },
      },
      orderBy: { student: { name: "asc" } },
    }),
    prisma.groupInvite.findMany({
      where: { assignmentId: assignment.id, status: "PENDING" },
      select: {
        id: true,
        groupId: true,
        inviteeId: true,
        inviter: { select: { name: true } },
        invitee: { select: { name: true } },
        group: { select: { name: true } },
      },
    }),
  ]);

  const groupedIds = new Set<number>();
  let myGroupId: number | null = null;
  const groups: BoardGroup[] = groupRows.map((g) => {
    const members: BoardMember[] = g.members.map((m) => {
      groupedIds.add(m.student.id);
      return {
        id: m.student.id,
        name: m.student.name,
        matricNum: m.student.matricNum,
        avatarPath: m.student.avatarPath,
        role: m.role,
      };
    });
    const isMine = members.some((m) => m.id === viewerId);
    if (isMine) myGroupId = g.id;
    return { id: g.id, name: g.name, maxMembers: g.maxMembers, members, isMine };
  });

  // Ungrouped pool = enrolled roster minus everyone already in an ad-hoc group.
  const ungrouped: PoolStudent[] = roster
    .map((e) => e.student)
    .filter((s) => !groupedIds.has(s.id));

  // Pending-invite context for the viewer (students only).
  const invitedIds = new Set(pendingInvites.map((i) => i.inviteeId));
  const myPendingInvites: BoardPendingInvite[] =
    role === "STUDENT"
      ? pendingInvites
          .filter(
            (i) =>
              i.inviteeId === viewerId ||
              (myGroupId !== null && i.groupId === myGroupId),
          )
          .map((i) => ({
            id: i.id,
            groupId: i.groupId,
            groupName: i.group.name,
            inviterName: i.inviter.name,
            inviteeName: i.invitee.name,
            incoming: i.inviteeId === viewerId,
          }))
      : [];

  // Invitable split (students who belong to a group can invite from this).
  const invitable: PoolStudent[] = [];
  const nonInvitable: AdHocBoard["nonInvitable"] = [];
  for (const e of roster) {
    const s = e.student;
    if (s.id === viewerId) continue;
    if (groupedIds.has(s.id)) nonInvitable.push({ student: s, reason: "IN_GROUP" });
    else if (invitedIds.has(s.id)) nonInvitable.push({ student: s, reason: "ALREADY_INVITED" });
    else invitable.push(s);
  }

  return {
    assignmentId: assignment.id,
    courseCode: assignment.course.code,
    groupingMode: assignment.groupingMode,
    cap: 4,
    groups,
    ungrouped,
    myGroupId,
    myPendingInvites,
    invitable,
    nonInvitable,
  };
}
