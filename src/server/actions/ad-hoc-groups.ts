"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import {
  createAdHocGroupSchema,
  inviteSchema,
  listInvitablePoolSchema,
  respondToInviteSchema,
  cancelInviteSchema,
  type InvitablePool,
  type InviteErrorCode,
  type PoolStudent,
} from "@/schemas/ad-hoc-group";
import type { ActionResult } from "@/schemas/common";

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SELF-SERVICE AD-HOC GROUPING (Stage 2)
//
// Viva note — standing vs ad-hoc isolation:
//   Standing and ad-hoc groups share ONE table (project_groups), discriminated
//   by assignmentId (null = standing, set = ad-hoc). This file only ever touches
//   rows where assignmentId = <this assignment>, so standing groups are never
//   read or mutated here. (Moodle "groups vs groupings" parallel.)
//
// Viva note — per-context membership invariant:
//   A student may hold their standing-group membership AND one ad-hoc membership
//   for an assignment simultaneously. So every conflict check is scoped by
//   assignmentId, never by course alone.
//
// "SELF mode" is GroupingMode.CUSTOM (students self-organize). RANDOM is the
// lecturer auto-assign mode; INHERIT/INDIVIDUAL have no ad-hoc invites.
// ─────────────────────────────────────────────────────────────────────────────

const AD_HOC_GROUP_CAP = 4;

/** Localized message for each typed invite error code (BM). */
const INVITE_ERROR_MESSAGES: Record<InviteErrorCode, string> = {
  NOT_SELF_MODE: "Tugasan ini bukan mod bentuk-sendiri.",
  NOT_ENROLLED: "Anda tidak berdaftar dalam kursus ini.",
  INVITEE_NOT_ENROLLED: "Pelajar itu tidak berdaftar dalam kursus ini.",
  GROUP_NOT_FOUND: "Kumpulan tidak wujud.",
  GROUP_FULL: "Kumpulan ini sudah penuh.",
  INVITEE_IN_GROUP: "Pelajar itu sudah berada dalam satu kumpulan.",
  INVITEE_ALREADY_INVITED: "Pelajar itu sudah mempunyai jemputan tertangguh.",
  NOT_GROUP_MEMBER: "Anda bukan ahli kumpulan ini.",
  INVITE_NOT_FOUND: "Jemputan tidak wujud.",
  INVITE_NOT_PENDING: "Jemputan ini sudah diproses.",
  NOT_INVITEE: "Jemputan ini bukan untuk anda.",
  SELF_INVITE: "Anda tidak boleh menjemput diri sendiri.",
};

function inviteErr(code: InviteErrorCode): { ok: false; error: string; code: InviteErrorCode } {
  return { ok: false, error: INVITE_ERROR_MESSAGES[code], code };
}

function revalidateBoard(courseCode: string, assignmentId: number) {
  revalidatePath(`/student/tugasan/${assignmentId}`);
  revalidatePath(`/student/kursus/${courseCode}`);
  revalidatePath(`/lecturer/kursus/${courseCode}`);
  revalidatePath("/student/kumpulan");
}

/**
 * createAdHocGroup — only in SELF (CUSTOM) mode, only for enrolled students.
 * The creator becomes the group's first member (LEADER). Transactional: the
 * group + the creator's membership are created together, and we re-check the
 * per-assignment invariant INSIDE the transaction so two rapid clicks can't
 * leave the student in two ad-hoc groups.
 */
export async function createAdHocGroup(raw: unknown): Promise<ActionResult<{ groupId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh membentuk kumpulan." };
  }

  const parsed = createAdHocGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const assignment = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          enrollments: { where: { studentId }, select: { id: true } },
        },
      },
    },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (assignment.groupingMode !== "CUSTOM") {
    return { ok: false, error: INVITE_ERROR_MESSAGES.NOT_SELF_MODE };
  }
  if (assignment.course.enrollments.length === 0) {
    return { ok: false, error: INVITE_ERROR_MESSAGES.NOT_ENROLLED };
  }

  const name =
    parsed.data.name?.trim() ||
    `Kumpulan ${session.user.name?.split(" ")[0] ?? "Pelajar"}`;

  try {
    const group = await prisma.$transaction(async (tx) => {
      // Per-context invariant, re-checked inside the tx: at most ONE ad-hoc
      // membership for this assignment. Scoped by assignmentId so the student's
      // standing-group membership is untouched.
      const existing = await tx.groupMember.findFirst({
        where: { studentId, group: { assignmentId: assignment.id } },
      });
      if (existing) throw new Error("ALREADY_IN_GROUP");

      return tx.projectGroup.create({
        data: {
          courseId: assignment.course.id,
          name,
          maxMembers: AD_HOC_GROUP_CAP,
          status: "APPROVED",
          createdById: studentId,
          assignmentId: assignment.id,
          members: { create: { studentId, role: "LEADER" } },
        },
        select: { id: true },
      });
    });

    revalidateBoard(assignment.course.code, assignment.id);
    return { ok: true, data: { groupId: group.id } };
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_IN_GROUP") {
      return { ok: false, error: "Anda sudah berada dalam kumpulan untuk tugasan ini." };
    }
    throw err;
  }
}

/**
 * listInvitablePool — the enrolled roster (minus the caller) split into:
 *   - invitable:     not in any ad-hoc group here AND no pending invite.
 *   - nonInvitable:  tagged IN_GROUP or ALREADY_INVITED so the UI disables the
 *                    invite button and shows the exact reason.
 * The roster comes from ClassEnrollment (the real source), never from group rows.
 */
export async function listInvitablePool(
  raw: unknown,
): Promise<ActionResult<InvitablePool>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh melihat kumpulan ini." };
  }

  const parsed = listInvitablePoolSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const assignment = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    select: {
      id: true,
      groupingMode: true,
      course: {
        select: {
          id: true,
          enrollments: { where: { studentId }, select: { id: true } },
        },
      },
    },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (assignment.course.enrollments.length === 0) {
    return { ok: false, error: INVITE_ERROR_MESSAGES.NOT_ENROLLED };
  }

  const [roster, groupedMembers, pendingInvites] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: { courseId: assignment.course.id },
      select: {
        student: {
          select: { id: true, name: true, matricNum: true, avatarPath: true },
        },
      },
      orderBy: { student: { name: "asc" } },
    }),
    // Confirmed members of ANY ad-hoc group for this assignment.
    prisma.groupMember.findMany({
      where: { group: { assignmentId: assignment.id } },
      select: { studentId: true },
    }),
    // Anyone with a live PENDING invite for this assignment.
    prisma.groupInvite.findMany({
      where: { assignmentId: assignment.id, status: "PENDING" },
      select: { inviteeId: true },
    }),
  ]);

  const inGroup = new Set(groupedMembers.map((m) => m.studentId));
  const invited = new Set(pendingInvites.map((i) => i.inviteeId));

  const invitable: PoolStudent[] = [];
  const nonInvitable: InvitablePool["nonInvitable"] = [];

  for (const e of roster) {
    if (e.student.id === studentId) continue; // never invite yourself
    const s: PoolStudent = {
      id: e.student.id,
      name: e.student.name,
      matricNum: e.student.matricNum,
      avatarPath: e.student.avatarPath,
    };
    if (inGroup.has(s.id)) nonInvitable.push({ student: s, reason: "IN_GROUP" });
    else if (invited.has(s.id)) nonInvitable.push({ student: s, reason: "ALREADY_INVITED" });
    else invitable.push(s);
  }

  return { ok: true, data: { invitable, nonInvitable } };
}

/**
 * invite — validate same course, group not full, invitee not already in a group
 * and not already pending; create a PENDING invite. Every check that guards the
 * write happens INSIDE the transaction so two concurrent invites can't both
 * succeed past the cap or double-invite the same student.
 */
export async function invite(
  raw: unknown,
): Promise<ActionResult<{ inviteId: number }> | ReturnType<typeof inviteErr>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh menjemput." };
  }

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const inviterId = session.user.id;
  const { groupId, inviteeId } = parsed.data;
  if (inviterId === inviteeId) return inviteErr("SELF_INVITE");

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: {
      course: { select: { id: true, code: true } },
      assignment: { select: { id: true, title: true, groupingMode: true } },
    },
  });
  if (!group || group.assignmentId === null || !group.assignment) {
    return inviteErr("GROUP_NOT_FOUND");
  }
  if (group.assignment.groupingMode !== "CUSTOM") return inviteErr("NOT_SELF_MODE");
  const assignmentId = group.assignment.id;

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Inviter must be a member of this group.
      const isMember = await tx.groupMember.findFirst({
        where: { groupId, studentId: inviterId },
        select: { id: true },
      });
      if (!isMember) throw new InviteError("NOT_GROUP_MEMBER");

      // Invitee must be enrolled in this course.
      const enrolled = await tx.classEnrollment.findUnique({
        where: { courseId_studentId: { courseId: group.course.id, studentId: inviteeId } },
        select: { id: true },
      });
      if (!enrolled) throw new InviteError("INVITEE_NOT_ENROLLED");

      // Group must have spare capacity.
      const memberCount = await tx.groupMember.count({ where: { groupId } });
      if (memberCount >= group.maxMembers) throw new InviteError("GROUP_FULL");

      // Invitee must not already be in an ad-hoc group for THIS assignment.
      const inviteeInGroup = await tx.groupMember.findFirst({
        where: { studentId: inviteeId, group: { assignmentId } },
        select: { id: true },
      });
      if (inviteeInGroup) throw new InviteError("INVITEE_IN_GROUP");

      // Invitee must not already have a PENDING invite for this assignment.
      const pending = await tx.groupInvite.findFirst({
        where: { assignmentId, inviteeId, status: "PENDING" },
        select: { id: true },
      });
      if (pending) throw new InviteError("INVITEE_ALREADY_INVITED");

      return tx.groupInvite.create({
        data: { assignmentId, groupId, inviterId, inviteeId, status: "PENDING" },
        select: { id: true },
      });
    });

    await notifyUser(inviteeId, {
      title: "Jemputan Kumpulan",
      message: `${session.user.name} menjemput anda ke "${group.name}" untuk tugasan "${group.assignment.title}".`,
      link: `student/tugasan/${assignmentId}`,
    });

    revalidateBoard(group.course.code, assignmentId);
    return { ok: true, data: { inviteId: created.id } };
  } catch (err) {
    if (err instanceof InviteError) return inviteErr(err.code);
    throw err;
  }
}

/**
 * respondToInvite — ACCEPT joins the group atomically and auto-CANCELS the
 * invitee's OTHER pending invites for this assignment (no double-booking).
 *
 * Viva note — why auto-cancel + atomic overlap prevention:
 *   Accepting joins exactly one group; any other invite this student is holding
 *   for the SAME assignment is now stale and would let them be pulled into a
 *   second group, breaking the per-assignment invariant. Cancelling them in the
 *   same transaction as the join closes that window — there is no instant where
 *   the student is both joined here and still invitable elsewhere.
 */
export async function respondToInvite(
  raw: unknown,
): Promise<ActionResult | ReturnType<typeof inviteErr>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh menjawab jemputan." };
  }

  const parsed = respondToInviteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const inviteRow = await prisma.groupInvite.findUnique({
    where: { id: parsed.data.inviteId },
    include: {
      group: {
        include: {
          course: { select: { code: true } },
          members: { select: { studentId: true } },
        },
      },
    },
  });
  if (!inviteRow) return inviteErr("INVITE_NOT_FOUND");
  if (inviteRow.inviteeId !== studentId) return inviteErr("NOT_INVITEE");
  if (inviteRow.status !== "PENDING") return inviteErr("INVITE_NOT_PENDING");

  const assignmentId = inviteRow.assignmentId;
  const courseCode = inviteRow.group.course.code;

  if (parsed.data.action === "DECLINE") {
    await prisma.groupInvite.update({
      where: { id: inviteRow.id },
      data: { status: "DECLINED" },
    });
    revalidateBoard(courseCode, assignmentId);
    return { ok: true };
  }

  // ACCEPT — everything in one transaction.
  try {
    await prisma.$transaction(async (tx) => {
      // Re-check capacity inside the tx (someone may have filled it).
      const memberCount = await tx.groupMember.count({ where: { groupId: inviteRow.groupId } });
      const group = await tx.projectGroup.findUnique({
        where: { id: inviteRow.groupId },
        select: { maxMembers: true },
      });
      if (!group) throw new InviteError("GROUP_NOT_FOUND");
      if (memberCount >= group.maxMembers) throw new InviteError("GROUP_FULL");

      // Per-context invariant: must not already be in an ad-hoc group here.
      const already = await tx.groupMember.findFirst({
        where: { studentId, group: { assignmentId } },
        select: { id: true },
      });
      if (already) throw new InviteError("INVITEE_IN_GROUP");

      // Join.
      await tx.groupMember.create({
        data: { groupId: inviteRow.groupId, studentId, role: "MEMBER" },
      });
      // Mark this invite accepted.
      await tx.groupInvite.update({
        where: { id: inviteRow.id },
        data: { status: "ACCEPTED" },
      });
      // Auto-cancel every OTHER pending invite this student holds for this
      // assignment — closes the double-booking window atomically.
      await tx.groupInvite.updateMany({
        where: {
          assignmentId,
          inviteeId: studentId,
          status: "PENDING",
          id: { not: inviteRow.id },
        },
        data: { status: "CANCELLED" },
      });
    });
  } catch (err) {
    if (err instanceof InviteError) return inviteErr(err.code);
    throw err;
  }

  await notifyUser(inviteRow.inviterId, {
    title: "Jemputan Diterima",
    message: `${session.user.name} telah menyertai "${inviteRow.group.name}".`,
    link: `student/tugasan/${assignmentId}`,
  });

  revalidateBoard(courseCode, assignmentId);
  return { ok: true };
}

/**
 * cancelInvite — the inviter (or any current member of the inviting group)
 * withdraws a still-pending invite they sent.
 */
export async function cancelInvite(
  raw: unknown,
): Promise<ActionResult | ReturnType<typeof inviteErr>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  const parsed = cancelInviteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const inviteRow = await prisma.groupInvite.findUnique({
    where: { id: parsed.data.inviteId },
    include: {
      group: {
        include: {
          course: { select: { code: true } },
          members: { select: { studentId: true } },
        },
      },
    },
  });
  if (!inviteRow) return inviteErr("INVITE_NOT_FOUND");
  if (inviteRow.status !== "PENDING") return inviteErr("INVITE_NOT_PENDING");
  const isInvitingMember =
    inviteRow.inviterId === studentId ||
    inviteRow.group.members.some((m) => m.studentId === studentId);
  if (!isInvitingMember) return inviteErr("NOT_GROUP_MEMBER");

  await prisma.groupInvite.update({
    where: { id: inviteRow.id },
    data: { status: "CANCELLED" },
  });
  revalidateBoard(inviteRow.group.course.code, inviteRow.assignmentId);
  return { ok: true };
}

/** Internal control-flow carrier so transaction callbacks can surface a typed code. */
class InviteError extends Error {
  constructor(public readonly code: InviteErrorCode) {
    super(code);
  }
}
