"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
 */
export async function getCourseContributionScores(
  courseId: number,
): Promise<Map<number, { score: number | null; riskFlag: boolean }>> {
  const groups = await prisma.projectGroup.findMany({
    where: { courseId },
    select: { id: true },
  });

  const out = new Map<number, { score: number | null; riskFlag: boolean }>();
  for (const g of groups) {
    const rows = await getContributionScore(g.id);
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
