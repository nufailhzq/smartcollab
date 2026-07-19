"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import {
  submitPeerAssessmentSchema,
  submitSelfDeclarationSchema,
  logContributionSchema,
  type ContributionScore,
  type PeerAssessmentStatus,
  type ContributionActionTypeInput,
} from "@/schemas/contribution";
import type { ActionResult } from "@/schemas/common";

// ─────────────────────────────────────────────────────────────────────────────
// Free-rider detection — server actions.
//
// Group assignments submit as one propagated row per member, so there's no
// individual contribution signal. These actions collect three signals and
// aggregate them per member: peer assessment, an activity log, and a self-
// declaration. All follow the project's action conventions (auth → role → zod →
// prisma → ActionResult).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the caller's group for an assignment in the SAME grouping context the
 * submit flow uses: INHERIT → the course's standing group (assignmentId null);
 * CUSTOM/OPEN/RANDOM → the ad-hoc group scoped to this assignment. Returns the
 * group id + its member ids, or null if the student isn't grouped for it.
 */
async function resolveGroupForStudent(
  assignmentId: number,
  studentId: number,
): Promise<{ groupId: number; memberIds: number[] } | null> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, courseId: true, groupingMode: true },
  });
  if (!assignment) return null;

  const groupContext =
    assignment.groupingMode === "INHERIT"
      ? { courseId: assignment.courseId, assignmentId: null }
      : { assignmentId: assignment.id };

  const group = await prisma.projectGroup.findFirst({
    where: { ...groupContext, members: { some: { studentId } } },
    select: { id: true, members: { select: { studentId: true } } },
  });
  if (!group) return null;
  return { groupId: group.id, memberIds: group.members.map((m) => m.studentId) };
}

/**
 * submitPeerAssessment — a student rates their teammates' contribution for a
 * tugasan. Validates group membership, forbids self-ratings and rating
 * non-members, then upserts one PeerAssessment per rating.
 */
export async function submitPeerAssessment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh menilai rakan sekumpulan." };
  }

  const parsed = submitPeerAssessmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const raterId = session.user.id;
  const { tugasanId, ratings } = parsed.data;

  const group = await resolveGroupForStudent(tugasanId, raterId);
  if (!group) {
    return { ok: false, error: "Anda bukan ahli kumpulan untuk tugasan ini." };
  }

  const memberSet = new Set(group.memberIds);
  for (const r of ratings) {
    if (r.rateeId === raterId) {
      return { ok: false, error: "Anda tidak boleh menilai diri sendiri." };
    }
    if (!memberSet.has(r.rateeId)) {
      return { ok: false, error: "Anda hanya boleh menilai ahli kumpulan anda." };
    }
  }

  try {
    await prisma.$transaction(
      ratings.map((r) =>
        prisma.peerAssessment.upsert({
          where: {
            tugasanId_raterId_rateeId: { tugasanId, raterId, rateeId: r.rateeId },
          },
          update: { contributionScore: r.score, comment: r.comment || null },
          create: {
            tugasanId,
            groupId: group.groupId,
            raterId,
            rateeId: r.rateeId,
            contributionScore: r.score,
            comment: r.comment || null,
          },
        }),
      ),
    );
  } catch (err) {
    console.error("submitPeerAssessment failed:", err);
    return { ok: false, error: "Gagal menyimpan penilaian." };
  }

  revalidatePath("/student/tugasan");
  revalidatePath(`/student/tugasan/${tugasanId}`);
  revalidatePath("/lecturer/pemantauan");
  return { ok: true };
}

/**
 * getPeerAssessmentStatus — for one group + tugasan, who has submitted their
 * ratings (rated at least one teammate) and who hasn't.
 */
export async function getPeerAssessmentStatus(
  tugasanId: number,
  groupId: number,
): Promise<PeerAssessmentStatus[]> {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { student: { select: { id: true, name: true, matricNum: true } } },
    orderBy: { student: { name: "asc" } },
  });

  const raters = new Set(
    (
      await prisma.peerAssessment.findMany({
        where: { tugasanId, groupId },
        select: { raterId: true },
        distinct: ["raterId"],
      })
    ).map((r) => r.raterId),
  );

  return members.map((m) => ({
    memberId: m.student.id,
    name: m.student.name,
    matricNum: m.student.matricNum,
    submitted: raters.has(m.student.id),
  }));
}

/**
 * logContributionAction — fire-and-forget activity logger. Mirrors trackAccess:
 * it swallows every error so it can never disrupt the calling action, and does
 * nothing when there's no session. Not exported as the primary API surface for
 * callers that already have the ids; use logContribution() below from actions.
 */
export async function logContribution(raw: unknown): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    if (!session) return { ok: false };
    const parsed = logContributionSchema.safeParse(raw);
    if (!parsed.success) return { ok: false };

    await prisma.contributionLog.create({
      data: {
        userId: session.user.id,
        groupId: parsed.data.groupId,
        actionType: parsed.data.actionType,
        tugasanId: parsed.data.tugasanId ?? null,
      },
    });
    return { ok: true };
  } catch (err) {
    // Logging must never break the calling action.
    console.error("logContribution failed:", err);
    return { ok: false };
  }
}

/**
 * Internal helper for call sites that already know the student + assignment but
 * not the group: resolves the group, then logs. Fully swallowed on failure.
 */
export async function logContributionForAssignment(
  userId: number,
  assignmentId: number,
  actionType: ContributionActionTypeInput,
): Promise<void> {
  try {
    const group = await resolveGroupForStudent(assignmentId, userId);
    if (!group) return; // not a grouped assignment for this student — nothing to log
    await prisma.contributionLog.create({
      data: { userId, groupId: group.groupId, tugasanId: assignmentId, actionType },
    });
  } catch (err) {
    console.error("logContributionForAssignment failed:", err);
  }
}

/**
 * submitSelfDeclaration — the caller's own description of what they contributed
 * to a tugasan. Upserts (one per user+tugasan).
 */
export async function submitSelfDeclaration(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh mengisi sumbangan sendiri." };
  }

  const parsed = submitSelfDeclarationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const userId = session.user.id;
  const group = await resolveGroupForStudent(parsed.data.tugasanId, userId);
  if (!group) {
    return { ok: false, error: "Anda bukan ahli kumpulan untuk tugasan ini." };
  }

  try {
    await prisma.selfDeclaredContribution.upsert({
      where: { userId_tugasanId: { userId, tugasanId: parsed.data.tugasanId } },
      update: { description: parsed.data.description },
      create: {
        userId,
        groupId: group.groupId,
        tugasanId: parsed.data.tugasanId,
        description: parsed.data.description,
      },
    });
  } catch (err) {
    console.error("submitSelfDeclaration failed:", err);
    return { ok: false, error: "Gagal menyimpan sumbangan." };
  }

  revalidatePath(`/student/tugasan/${parsed.data.tugasanId}`);
  revalidatePath("/lecturer/pemantauan");
  return { ok: true };
}

/**
 * getMyContributionInputs — the caller's own already-submitted peer ratings +
 * self-declaration for a tugasan, so the student form can pre-fill them.
 */
export async function getMyContributionInputs(tugasanId: number): Promise<{
  ratings: { rateeId: number; score: number; comment: string | null }[];
  selfDescription: string | null;
}> {
  const session = await auth();
  if (!session) return { ratings: [], selfDescription: null };
  const userId = session.user.id;

  const [ratings, self] = await Promise.all([
    prisma.peerAssessment.findMany({
      where: { tugasanId, raterId: userId },
      select: { rateeId: true, contributionScore: true, comment: true },
    }),
    prisma.selfDeclaredContribution.findUnique({
      where: { userId_tugasanId: { userId, tugasanId } },
      select: { description: true },
    }),
  ]);

  return {
    ratings: ratings.map((r) => ({
      rateeId: r.rateeId,
      score: r.contributionScore,
      comment: r.comment,
    })),
    selfDescription: self?.description ?? null,
  };
}

// ── Scoring aggregator ───────────────────────────────────────────────────────

/** Average with an optional min/max trim (drops one min + one max if n > 3). */
function trimmedMean(values: number[]): number | null {
  if (values.length === 0) return null;
  if (values.length <= 3) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1); // drop lowest + highest outlier
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/**
 * getContributionScore — per-member contribution scoring for a group.
 *
 *   peerScore     = trimmed mean of scores received from teammates (self excluded).
 *   activityScore = member's ContributionLog count, normalised to the group mean
 *                   (1.0 = exactly the group average).
 *   riskFlag      = true only when BOTH peerScore AND activityScore are below 60%
 *                   of the group average for that tugasan — never on one signal.
 *
 * `tugasanId` optional: when given, scoping is per-assignment; when omitted,
 * peer + activity are aggregated across the group's whole history.
 */
export async function getContributionScore(
  groupId: number,
  tugasanId?: number,
): Promise<ContributionScore[]> {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { student: { select: { id: true, name: true, matricNum: true } } },
    orderBy: { student: { name: "asc" } },
  });
  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.student.id);

  const [peerRows, logRows] = await Promise.all([
    prisma.peerAssessment.findMany({
      where: {
        groupId,
        ...(tugasanId ? { tugasanId } : {}),
        rateeId: { in: memberIds },
      },
      select: { rateeId: true, raterId: true, contributionScore: true },
    }),
    prisma.contributionLog.groupBy({
      by: ["userId"],
      where: {
        groupId,
        ...(tugasanId ? { tugasanId } : {}),
        userId: { in: memberIds },
      },
      _count: { _all: true },
    }),
  ]);

  // Peer scores per ratee (exclude self-ratings), then trimmed mean.
  const peerByRatee = new Map<number, number[]>();
  for (const p of peerRows) {
    if (p.raterId === p.rateeId) continue; // exclude self-ratings
    const arr = peerByRatee.get(p.rateeId) ?? [];
    arr.push(p.contributionScore);
    peerByRatee.set(p.rateeId, arr);
  }
  const peerScoreByUser = new Map<number, number | null>();
  for (const id of memberIds) {
    peerScoreByUser.set(id, trimmedMean(peerByRatee.get(id) ?? []));
  }

  // Raw activity counts.
  const activityCountByUser = new Map<number, number>();
  for (const id of memberIds) activityCountByUser.set(id, 0);
  for (const row of logRows) {
    activityCountByUser.set(row.userId, row._count._all);
  }

  // Group averages (basis for normalisation + the risk threshold).
  const peerValues = memberIds
    .map((id) => peerScoreByUser.get(id))
    .filter((v): v is number => v !== null);
  const groupPeerAvg =
    peerValues.length > 0 ? peerValues.reduce((a, b) => a + b, 0) / peerValues.length : 0;

  const activityValues = memberIds.map((id) => activityCountByUser.get(id) ?? 0);
  const groupActivityAvg =
    activityValues.reduce((a, b) => a + b, 0) / Math.max(1, activityValues.length);

  return members.map((m) => {
    const id = m.student.id;
    const peerScore = peerScoreByUser.get(id) ?? null;
    const activityCount = activityCountByUser.get(id) ?? 0;
    const activityScore =
      groupActivityAvg > 0 ? activityCount / groupActivityAvg : 0;

    // riskFlag needs BOTH signals below 60% of the group average. A member with
    // no peer scores yet can't be confidently flagged, so require a peer score.
    const peerBelow =
      peerScore !== null && groupPeerAvg > 0 && peerScore < 0.6 * groupPeerAvg;
    const activityBelow =
      groupActivityAvg > 0 && activityCount < 0.6 * groupActivityAvg;
    const riskFlag = peerBelow && activityBelow;

    return {
      userId: id,
      name: m.student.name,
      matricNum: m.student.matricNum,
      peerScore: peerScore === null ? null : Math.round(peerScore),
      activityScore: Math.round(activityScore * 100) / 100,
      activityCount,
      riskFlag,
    };
  });
}

/**
 * getGroupContributionDetail — lecturer drill-down for one group. Per member:
 * the combined contribution scoring, the individual peer scores + comments
 * received (lecturer-only), activity count, and their self-declaration text.
 * Lecturer-authorized: the caller must own the group's course.
 */
export async function getGroupContributionDetail(
  courseId: number,
  groupName: string,
): Promise<
  | {
      ok: true;
      groupId: number;
      groupName: string;
      members: {
        userId: number;
        name: string;
        matricNum: string | null;
        peerScore: number | null;
        activityCount: number;
        riskFlag: boolean;
        received: { raterName: string; score: number; comment: string | null }[];
        selfDeclaration: string | null;
      }[];
    }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER" && session.user.role !== "ADMIN") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { lecturerId: true },
  });
  if (!course) return { ok: false, error: "Kursus tidak wujud." };
  if (session.user.role === "LECTURER" && course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  const group = await prisma.projectGroup.findFirst({
    where: { courseId, name: groupName },
    select: { id: true, name: true },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };

  const [scores, peerRows, selfRows] = await Promise.all([
    getContributionScore(group.id),
    prisma.peerAssessment.findMany({
      where: { groupId: group.id },
      select: {
        rateeId: true,
        contributionScore: true,
        comment: true,
        rater: { select: { name: true } },
      },
    }),
    prisma.selfDeclaredContribution.findMany({
      where: { groupId: group.id },
      select: { userId: true, description: true },
    }),
  ]);

  const receivedByRatee = new Map<
    number,
    { raterName: string; score: number; comment: string | null }[]
  >();
  for (const p of peerRows) {
    const arr = receivedByRatee.get(p.rateeId) ?? [];
    arr.push({ raterName: p.rater.name, score: p.contributionScore, comment: p.comment });
    receivedByRatee.set(p.rateeId, arr);
  }
  const selfByUser = new Map(selfRows.map((s) => [s.userId, s.description]));

  return {
    ok: true,
    groupId: group.id,
    groupName: group.name,
    members: scores.map((s) => ({
      userId: s.userId,
      name: s.name,
      matricNum: s.matricNum,
      peerScore: s.peerScore,
      activityCount: s.activityCount,
      riskFlag: s.riskFlag,
      received: receivedByRatee.get(s.userId) ?? [],
      selfDeclaration: selfByUser.get(s.userId) ?? null,
    })),
  };
}

/**
 * getCourseContributionScores — course-wide free-rider signal for the Progress
 * Monitoring table. Runs getContributionScore for every group in the course and
 * flattens to a per-student map: a combined 0–100 "Skor Sumbangan" (peer-weighted,
 * activity as a modifier) and the riskFlag. A student appears once; if they're in
 * multiple groups their worst (lowest) group score is kept.
 *
 * `tugasanId` optional: when given, the signal is scoped to that one tugasan —
 * peer + activity are counted only for that assignment, and only the groups that
 * apply to it (its ad-hoc group, or the course's standing groups for INHERIT
 * assignments) are considered. When omitted, everything is summed across the
 * course's whole history ("Semua").
 */
export async function getCourseContributionScores(
  courseId: number,
  tugasanId?: number,
): Promise<Map<number, { score: number | null; riskFlag: boolean }>> {
  // Which groups to score. For a specific tugasan we only want the groups that
  // actually apply to it: INHERIT → the course's standing groups (assignmentId
  // null); otherwise → the tugasan's own ad-hoc group (assignmentId = tugasanId).
  let groupWhere: { courseId: number; assignmentId?: number | null } = { courseId };
  if (tugasanId) {
    const tugasan = await prisma.assignment.findUnique({
      where: { id: tugasanId },
      select: { groupingMode: true },
    });
    groupWhere =
      tugasan?.groupingMode === "INHERIT"
        ? { courseId, assignmentId: null }
        : { courseId, assignmentId: tugasanId };
  }

  const groups = await prisma.projectGroup.findMany({
    where: groupWhere,
    select: { id: true },
  });

  const out = new Map<number, { score: number | null; riskFlag: boolean }>();
  for (const g of groups) {
    const rows = await getContributionScore(g.id, tugasanId);
    for (const r of rows) {
      // Combined score: peer score is the spine; nudge by activity (0.85–1.15x)
      // so a very inactive member is pulled down and a very active one nudged up.
      let combined: number | null = null;
      if (r.peerScore !== null) {
        const activityMod = Math.max(0.85, Math.min(1.15, r.activityScore || 1));
        combined = Math.round(Math.max(0, Math.min(100, r.peerScore * activityMod)));
      }
      const prev = out.get(r.userId);
      if (
        !prev ||
        (combined !== null && (prev.score === null || combined < prev.score))
      ) {
        out.set(r.userId, { score: combined, riskFlag: r.riskFlag || (prev?.riskFlag ?? false) });
      } else if (r.riskFlag && prev) {
        out.set(r.userId, { ...prev, riskFlag: true });
      }
    }
  }
  return out;
}

/**
 * getAssignmentContributionDetail — lecturer view for ONE group tugasan. Returns,
 * per student across every group that applies to the tugasan: their contribution
 * % (combined peer + activity, scoped to this tugasan), riskFlag, their own
 * "Sumbangan Sendiri" comment, and the peer ratings + comments they received.
 * Lecturer/Admin-authorized: the caller must own the tugasan's course.
 *
 * This powers the per-tugasan contribution panel on the lecturer course page.
 */
export async function getAssignmentContributionDetail(tugasanId: number): Promise<
  | {
      ok: true;
      members: {
        userId: number;
        name: string;
        matricNum: string | null;
        groupName: string;
        contributionScore: number | null;
        riskFlag: boolean;
        selfDeclaration: string | null;
        received: { raterName: string; score: number; comment: string | null }[];
      }[];
    }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER" && session.user.role !== "ADMIN") {
    return { ok: false, error: "Tidak dibenarkan." };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: tugasanId },
    select: { id: true, courseId: true, groupingMode: true, course: { select: { lecturerId: true } } },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (session.user.role === "LECTURER" && assignment.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  // The groups that apply to this tugasan: INHERIT → course standing groups;
  // otherwise → the tugasan's own ad-hoc group.
  const groupWhere =
    assignment.groupingMode === "INHERIT"
      ? { courseId: assignment.courseId, assignmentId: null }
      : { courseId: assignment.courseId, assignmentId: tugasanId };
  const groups = await prisma.projectGroup.findMany({
    where: groupWhere,
    select: { id: true, name: true },
  });

  const members: {
    userId: number;
    name: string;
    matricNum: string | null;
    groupName: string;
    contributionScore: number | null;
    riskFlag: boolean;
    selfDeclaration: string | null;
    received: { raterName: string; score: number; comment: string | null }[];
  }[] = [];

  for (const g of groups) {
    const [scores, peerRows, selfRows] = await Promise.all([
      getContributionScore(g.id, tugasanId),
      prisma.peerAssessment.findMany({
        where: { groupId: g.id, tugasanId },
        select: {
          rateeId: true,
          contributionScore: true,
          comment: true,
          rater: { select: { name: true } },
        },
      }),
      prisma.selfDeclaredContribution.findMany({
        where: { groupId: g.id, tugasanId },
        select: { userId: true, description: true },
      }),
    ]);

    const receivedByRatee = new Map<
      number,
      { raterName: string; score: number; comment: string | null }[]
    >();
    for (const p of peerRows) {
      const arr = receivedByRatee.get(p.rateeId) ?? [];
      arr.push({ raterName: p.rater.name, score: p.contributionScore, comment: p.comment });
      receivedByRatee.set(p.rateeId, arr);
    }
    const selfByUser = new Map(selfRows.map((s) => [s.userId, s.description]));

    for (const s of scores) {
      // Same combined score the monitoring table uses: peer score nudged by
      // activity (0.85–1.15x).
      let combined: number | null = null;
      if (s.peerScore !== null) {
        const activityMod = Math.max(0.85, Math.min(1.15, s.activityScore || 1));
        combined = Math.round(Math.max(0, Math.min(100, s.peerScore * activityMod)));
      }
      members.push({
        userId: s.userId,
        name: s.name,
        matricNum: s.matricNum,
        groupName: g.name,
        contributionScore: combined,
        riskFlag: s.riskFlag,
        selfDeclaration: selfByUser.get(s.userId) ?? null,
        received: receivedByRatee.get(s.userId) ?? [],
      });
    }
  }

  members.sort(
    (a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name),
  );
  return { ok: true, members };
}

// ─────────────────────────────────────────────────────────────────────────────
// Peer-assessment reminders — on-access, throttled to ~24h per user (no cron).
// Mirrors dispatchDueEventReminders: fired on page load; a student who owes a
// peer assessment / self-declaration for a submitted GROUP tugasan gets one
// reminder notification at most once a day.
// ─────────────────────────────────────────────────────────────────────────────

const lastPeerReminderAt = new Map<number, number>();
const PEER_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function dispatchPeerAssessmentReminders(
  userId: number,
): Promise<{ fired: number }> {
  const now = Date.now();
  const prev = lastPeerReminderAt.get(userId);
  if (prev && now - prev < PEER_REMINDER_INTERVAL_MS) return { fired: 0 };
  lastPeerReminderAt.set(userId, now);

  try {
    // The user's ad-hoc + standing groups, with the members + the assignment.
    const groups = await prisma.projectGroup.findMany({
      where: { members: { some: { studentId: userId } } },
      select: {
        id: true,
        assignmentId: true,
        courseId: true,
        members: { select: { studentId: true } },
      },
    });
    if (groups.length === 0) return { fired: 0 };

    let fired = 0;
    for (const g of groups) {
      // The tugasan this group is for. Standing groups (assignmentId null) apply
      // to every GROUP assignment in the course under INHERIT mode; to keep this
      // simple and correct we only remind for ad-hoc groups (assignmentId set),
      // which is where per-assignment peer assessment is meaningful.
      if (!g.assignmentId) continue;
      const tugasanId = g.assignmentId;

      // Only remind once the group has actually submitted this tugasan.
      const submitted = await prisma.submission.findFirst({
        where: { assignmentId: tugasanId, filePath: { not: null } },
        select: { id: true },
      });
      if (!submitted) continue;

      const teammateIds = g.members.map((m) => m.studentId).filter((id) => id !== userId);

      const [selfDone, ratedCount] = await Promise.all([
        prisma.selfDeclaredContribution.findUnique({
          where: { userId_tugasanId: { userId, tugasanId } },
          select: { id: true },
        }),
        teammateIds.length === 0
          ? Promise.resolve(0)
          : prisma.peerAssessment.count({
              where: { tugasanId, raterId: userId, rateeId: { in: teammateIds } },
            }),
      ]);

      const owesSelf = !selfDone;
      const owesPeer = teammateIds.length > 0 && ratedCount < teammateIds.length;
      if (owesSelf || owesPeer) {
        const assignment = await prisma.assignment.findUnique({
          where: { id: tugasanId },
          select: { title: true },
        });
        await notifyUser(userId, {
          title: "Peringatan Penilaian Rakan Sekumpulan",
          message: `Sila lengkapkan Sumbangan Sendiri dan Penilaian Rakan Sekumpulan untuk "${assignment?.title ?? "tugasan kumpulan"}".`,
          link: `student/tugasan/${tugasanId}`,
        });
        fired++;
      }
    }
    return { fired };
  } catch (err) {
    console.error("dispatchPeerAssessmentReminders failed:", err);
    return { fired: 0 };
  }
}
