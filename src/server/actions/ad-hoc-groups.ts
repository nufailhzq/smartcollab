"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser, notifyMany } from "@/lib/notifications";
import {
  createAdHocGroupSchema,
  joinOpenGroupSchema,
  inviteToOpenGroupSchema,
  createOpenGroupSchema,
  type AdHocErrorCode,
} from "@/schemas/ad-hoc-group";
import type { ActionResult } from "@/schemas/common";

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT AD-HOC GROUPING — two mutually-exclusive modes per assignment.
//
//   CUSTOM (Mode A): students form their own group (name + chosen friends) →
//     the group is PENDING until the lecturer approves/declines it via the
//     shared lecturer approval flow (setGroupStatus). Members are "locked" while
//     pending: they can't be in another ad-hoc group/application for this
//     assignment.
//
//   OPEN (Mode B): the lecturer opens empty groups; any enrolled student
//     self-joins instantly (APPROVED, no approval step), and any member can pull
//     a friend in — the friend auto-joins instantly. Joining/inviting is blocked
//     once the assignment's joinCloseAt has passed.
//
// Standing vs ad-hoc isolation: every read/write here is scoped by
// group.assignmentId = <this assignment>, so standing groups (assignmentId null)
// are never touched.
// ─────────────────────────────────────────────────────────────────────────────

const AD_HOC_GROUP_CAP = 4;

/** Localized message for each typed error code (BM). */
const AD_HOC_ERROR_MESSAGES: Record<AdHocErrorCode, string> = {
  NOT_SELF_MODE: "Tugasan ini bukan mod bentuk-sendiri (perlu kelulusan).",
  NOT_OPEN_MODE: "Tugasan ini bukan mod kumpulan terbuka.",
  NOT_ENROLLED: "Anda tidak berdaftar dalam kursus ini.",
  INVITEE_NOT_ENROLLED: "Pelajar itu tidak berdaftar dalam kursus ini.",
  GROUP_NOT_FOUND: "Kumpulan tidak wujud.",
  GROUP_FULL: "Kumpulan ini sudah penuh.",
  ALREADY_IN_GROUP: "Anda sudah berada dalam satu kumpulan untuk tugasan ini.",
  INVITEE_IN_GROUP: "Pelajar itu sudah berada dalam satu kumpulan.",
  MEMBER_IN_PENDING: "Seorang ahli sudah mempunyai permohonan kumpulan tertangguh.",
  INVITEE_IN_PENDING: "Pelajar itu sudah mempunyai permohonan kumpulan tertangguh.",
  NOT_GROUP_MEMBER: "Anda bukan ahli kumpulan ini.",
  JOIN_CLOSED: "Tempoh menyertai kumpulan telah ditutup.",
  SELF_INVITE: "Anda tidak boleh menjemput diri sendiri.",
};

function err(code: AdHocErrorCode): { ok: false; error: string; code: AdHocErrorCode } {
  return { ok: false, error: AD_HOC_ERROR_MESSAGES[code], code };
}

/** Internal control-flow carrier so transaction callbacks can surface a typed code. */
class AdHocError extends Error {
  constructor(public readonly code: AdHocErrorCode) {
    super(code);
  }
}

function revalidateBoard(courseCode: string, assignmentId: number) {
  revalidatePath(`/student/tugasan/${assignmentId}`);
  revalidatePath(`/student/kursus/${courseCode}`);
  revalidatePath(`/lecturer/kursus/${courseCode}`);
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath("/student/kumpulan");
}

// ─── Mode A: student-formed, lecturer-approved ───────────────────────────────

/**
 * createAdHocGroup (CUSTOM mode) — the student names a group and picks the
 * friends they want in it. The group is created PENDING with the creator as
 * LEADER and the chosen friends as MEMBERs; the lecturer must approve it before
 * anyone is "really" grouped. Transactional: we re-check, inside the tx, that
 * NONE of the proposed members are already in a group or another pending
 * application for this assignment, so two rapid submissions can't double-book.
 */
export async function createAdHocGroup(raw: unknown): Promise<ActionResult<{ groupId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh membentuk kumpulan." };
  }

  const parsed = createAdHocGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const creatorId = session.user.id;
  const assignment = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          enrollments: { select: { studentId: true } },
        },
      },
    },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (assignment.groupingMode !== "CUSTOM") return err("NOT_SELF_MODE");

  const enrolledIds = new Set(assignment.course.enrollments.map((e) => e.studentId));
  if (!enrolledIds.has(creatorId)) return err("NOT_ENROLLED");

  // Proposed roster = creator + chosen friends (deduped, creator excluded from picks).
  const memberIds = Array.from(
    new Set([creatorId, ...parsed.data.memberIds.filter((id) => id !== creatorId)]),
  );
  // Every proposed member must be enrolled.
  if (memberIds.some((id) => !enrolledIds.has(id))) return err("INVITEE_NOT_ENROLLED");

  const name =
    parsed.data.name?.trim() ||
    `Kumpulan ${session.user.name?.split(" ")[0] ?? "Pelajar"}`;

  try {
    const group = await prisma.$transaction(async (tx) => {
      // None of the proposed members may already be confirmed in an ad-hoc group
      // for this assignment...
      const inGroup = await tx.groupMember.findFirst({
        where: {
          studentId: { in: memberIds },
          group: { assignmentId: assignment.id, status: "APPROVED" },
        },
        select: { id: true },
      });
      if (inGroup) throw new AdHocError("INVITEE_IN_GROUP");

      // ...nor part of another PENDING application for this assignment.
      const inPending = await tx.groupMember.findFirst({
        where: {
          studentId: { in: memberIds },
          group: { assignmentId: assignment.id, status: "PENDING" },
        },
        select: { id: true },
      });
      if (inPending) throw new AdHocError("MEMBER_IN_PENDING");

      return tx.projectGroup.create({
        data: {
          courseId: assignment.course.id,
          name,
          maxMembers: Math.max(AD_HOC_GROUP_CAP, memberIds.length),
          status: "PENDING",
          createdById: creatorId,
          assignmentId: assignment.id,
          members: {
            create: memberIds.map((studentId) => ({
              studentId,
              role: studentId === creatorId ? "LEADER" : "MEMBER",
            })),
          },
        },
        select: { id: true },
      });
    });

    // Notify the chosen friends they've been put in a pending application.
    const others = memberIds.filter((id) => id !== creatorId);
    await notifyMany(others, {
      title: "Permohonan Kumpulan",
      message: `${session.user.name} memasukkan anda dalam permohonan kumpulan "${name}" untuk "${assignment.title}". Menunggu kelulusan pensyarah.`,
      link: `student/tugasan/${assignment.id}`,
    });

    revalidateBoard(assignment.course.code, assignment.id);
    return { ok: true, data: { groupId: group.id } };
  } catch (e) {
    if (e instanceof AdHocError) return err(e.code);
    throw e;
  }
}

// ─── Mode B: lecturer-opened, self-join ──────────────────────────────────────

/** createOpenGroup (lecturer) — open one empty self-join group for an OPEN-mode assignment. */
export async function createOpenGroup(raw: unknown): Promise<ActionResult<{ groupId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = createOpenGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const assignment = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { course: { select: { id: true, code: true, lecturerId: true } } },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (assignment.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (assignment.groupingMode !== "OPEN") return err("NOT_OPEN_MODE");

  const count = await prisma.projectGroup.count({ where: { assignmentId: assignment.id } });
  const name = parsed.data.name?.trim() || `Kumpulan ${count + 1}`;

  const group = await prisma.projectGroup.create({
    data: {
      courseId: assignment.course.id,
      name,
      maxMembers: parsed.data.maxMembers,
      status: "APPROVED",
      createdById: session.user.id,
      assignmentId: assignment.id,
    },
    select: { id: true },
  });

  revalidateBoard(assignment.course.code, assignment.id);
  return { ok: true, data: { groupId: group.id } };
}

/** True once the assignment's join window has closed (OPEN mode auto-lock). */
function isJoinClosed(joinCloseAt: Date | null): boolean {
  return joinCloseAt !== null && joinCloseAt.getTime() <= Date.now();
}

/**
 * joinOpenGroup (OPEN mode) — an enrolled student self-joins, instantly and
 * without approval, provided the group has room and the join window is open.
 * The capacity + single-membership checks run INSIDE the transaction.
 */
export async function joinOpenGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") return { ok: false, error: "Hanya pelajar boleh menyertai." };

  const parsed = joinOpenGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const studentId = session.user.id;
  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { id: true, code: true } },
      assignment: { select: { id: true, groupingMode: true, joinCloseAt: true } },
    },
  });
  if (!group || !group.assignment || group.assignmentId === null) return err("GROUP_NOT_FOUND");
  if (group.assignment.groupingMode !== "OPEN") return err("NOT_OPEN_MODE");
  if (isJoinClosed(group.assignment.joinCloseAt)) return err("JOIN_CLOSED");
  const assignmentId = group.assignment.id;

  const enrolled = await prisma.classEnrollment.findUnique({
    where: { courseId_studentId: { courseId: group.course.id, studentId } },
    select: { id: true },
  });
  if (!enrolled) return err("NOT_ENROLLED");

  try {
    await prisma.$transaction(async (tx) => {
      const already = await tx.groupMember.findFirst({
        where: { studentId, group: { assignmentId } },
        select: { id: true },
      });
      if (already) throw new AdHocError("ALREADY_IN_GROUP");

      const memberCount = await tx.groupMember.count({ where: { groupId: group.id } });
      if (memberCount >= group.maxMembers) throw new AdHocError("GROUP_FULL");

      await tx.groupMember.create({
        data: { groupId: group.id, studentId, role: memberCount === 0 ? "LEADER" : "MEMBER" },
      });
    });
  } catch (e) {
    if (e instanceof AdHocError) return err(e.code);
    throw e;
  }

  revalidateBoard(group.course.code, assignmentId);
  return { ok: true };
}

/**
 * inviteToOpenGroup (OPEN mode) — any current member pulls a friend into their
 * group. The friend AUTO-JOINS instantly (no approval, no accept step), as long
 * as there's room and the window is open. All guards run inside the transaction.
 */
export async function inviteToOpenGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") return { ok: false, error: "Hanya pelajar boleh menjemput." };

  const parsed = inviteToOpenGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const inviterId = session.user.id;
  const { groupId, inviteeId } = parsed.data;
  if (inviterId === inviteeId) return err("SELF_INVITE");

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: {
      course: { select: { id: true, code: true } },
      assignment: { select: { id: true, title: true, groupingMode: true, joinCloseAt: true } },
    },
  });
  if (!group || !group.assignment || group.assignmentId === null) return err("GROUP_NOT_FOUND");
  if (group.assignment.groupingMode !== "OPEN") return err("NOT_OPEN_MODE");
  if (isJoinClosed(group.assignment.joinCloseAt)) return err("JOIN_CLOSED");
  const assignmentId = group.assignment.id;

  const enrolled = await prisma.classEnrollment.findUnique({
    where: { courseId_studentId: { courseId: group.course.id, studentId: inviteeId } },
    select: { id: true },
  });
  if (!enrolled) return err("INVITEE_NOT_ENROLLED");

  try {
    await prisma.$transaction(async (tx) => {
      const isMember = await tx.groupMember.findFirst({
        where: { groupId, studentId: inviterId },
        select: { id: true },
      });
      if (!isMember) throw new AdHocError("NOT_GROUP_MEMBER");

      const inviteeInGroup = await tx.groupMember.findFirst({
        where: { studentId: inviteeId, group: { assignmentId } },
        select: { id: true },
      });
      if (inviteeInGroup) throw new AdHocError("INVITEE_IN_GROUP");

      const memberCount = await tx.groupMember.count({ where: { groupId } });
      if (memberCount >= group.maxMembers) throw new AdHocError("GROUP_FULL");

      await tx.groupMember.create({
        data: { groupId, studentId: inviteeId, role: "MEMBER" },
      });
    });
  } catch (e) {
    if (e instanceof AdHocError) return err(e.code);
    throw e;
  }

  await notifyUser(inviteeId, {
    title: "Ditambah ke Kumpulan",
    message: `${session.user.name} menambah anda ke "${group.name}" untuk "${group.assignment.title}".`,
    link: `student/tugasan/${assignmentId}`,
  });

  revalidateBoard(group.course.code, assignmentId);
  return { ok: true };
}
