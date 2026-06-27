import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { NonInvitableReason, PoolStudent } from "@/schemas/ad-hoc-group";

// ─────────────────────────────────────────────────────────────────────────────
// Read model for the shared Groups board. One query shape serves both modes and
// both viewer roles; the page/component decides what to render.
//
//   CUSTOM (Mode A): students form their own group (PENDING until the lecturer
//     approves). The board shows the viewer's pending/approved state and a pool
//     of selectable friends for the create form.
//   OPEN   (Mode B): the lecturer opens empty groups; students self-join and
//     members auto-invite friends. The board shows join state + the join-close
//     deadline. Joining is locked once joinCloseAt has passed.
//
// Standing/ad-hoc isolation: every read filters group.assignmentId = <this
// assignment>, so standing groups (assignmentId null) never appear.
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
  status: "PENDING" | "APPROVED" | "REJECTED";
  isMine: boolean;
  hasCapacity: boolean;
};

export type AdHocBoard = {
  assignmentId: number;
  courseCode: string;
  groupingMode: "CUSTOM" | "OPEN";
  cap: number;
  groups: BoardGroup[];
  ungrouped: PoolStudent[];

  // Student-only context (empty/null for lecturers).
  myGroupId: number | null;
  /** True when the viewer is in a PENDING student-formed application (Mode A). */
  myGroupPending: boolean;
  /** The pool the viewer may pick (Mode A) or invite (Mode B), reason-tagged. */
  selectable: PoolStudent[];
  nonSelectable: { student: PoolStudent; reason: NonInvitableReason }[];

  // OPEN-mode (Mode B) only.
  joinCloseAt: Date | null;
  joinClosed: boolean;
};

/**
 * Build the board for one assignment. `viewerId`/`role` tailor the student-only
 * fields. Returns null if the assignment doesn't exist, isn't a CUSTOM/OPEN
 * ad-hoc assignment, or the viewer has no access (not enrolled / not the owning
 * lecturer / not admin).
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
      joinCloseAt: true,
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
  if (assignment.groupingMode !== "CUSTOM" && assignment.groupingMode !== "OPEN") {
    return null;
  }

  const isLecturerOwner = role === "LECTURER" && assignment.course.lecturerId === viewerId;
  const isAdmin = role === "ADMIN";
  const isEnrolledStudent = role === "STUDENT" && assignment.course.enrollments.length > 0;
  if (!isLecturerOwner && !isAdmin && !isEnrolledStudent) return null;

  const [groupRows, roster] = await Promise.all([
    prisma.projectGroup.findMany({
      where: { assignmentId: assignment.id },
      select: {
        id: true,
        name: true,
        maxMembers: true,
        status: true,
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
  ]);

  // Track who is confirmed (APPROVED group) vs tied up in a PENDING application.
  const approvedMemberIds = new Set<number>();
  const pendingMemberIds = new Set<number>();
  let myGroupId: number | null = null;
  let myGroupPending = false;

  const groups: BoardGroup[] = groupRows.map((g) => {
    const members: BoardMember[] = g.members.map((m) => {
      if (g.status === "APPROVED") approvedMemberIds.add(m.student.id);
      else if (g.status === "PENDING") pendingMemberIds.add(m.student.id);
      return {
        id: m.student.id,
        name: m.student.name,
        matricNum: m.student.matricNum,
        avatarPath: m.student.avatarPath,
        role: m.role,
      };
    });
    const isMine = members.some((m) => m.id === viewerId);
    if (isMine) {
      myGroupId = g.id;
      if (g.status === "PENDING") myGroupPending = true;
    }
    return {
      id: g.id,
      name: g.name,
      maxMembers: g.maxMembers,
      members,
      status: g.status,
      isMine,
      hasCapacity: members.length < g.maxMembers,
    };
  });

  // Ungrouped pool = enrolled roster minus everyone confirmed or pending.
  const ungrouped: PoolStudent[] = roster
    .map((e) => e.student)
    .filter((s) => !approvedMemberIds.has(s.id) && !pendingMemberIds.has(s.id));

  // Selectable split (for Mode A picking friends / Mode B inviting), reason-tagged.
  const selectable: PoolStudent[] = [];
  const nonSelectable: AdHocBoard["nonSelectable"] = [];
  for (const e of roster) {
    const s = e.student;
    if (s.id === viewerId) continue;
    if (approvedMemberIds.has(s.id)) nonSelectable.push({ student: s, reason: "IN_GROUP" });
    else if (pendingMemberIds.has(s.id)) nonSelectable.push({ student: s, reason: "IN_PENDING" });
    else selectable.push(s);
  }

  const joinCloseAt = assignment.joinCloseAt ?? null;
  const joinClosed =
    assignment.groupingMode === "OPEN" &&
    joinCloseAt !== null &&
    joinCloseAt.getTime() <= Date.now();

  return {
    assignmentId: assignment.id,
    courseCode: assignment.course.code,
    groupingMode: assignment.groupingMode,
    cap: 4,
    groups,
    ungrouped,
    myGroupId,
    myGroupPending,
    selectable,
    nonSelectable,
    joinCloseAt,
    joinClosed,
  };
}
