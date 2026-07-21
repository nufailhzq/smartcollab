import { z } from "zod";
import { idSchema } from "./common";

// ─────────────────────────────────────────────────────────────────────────────
// Free-rider detection — input schemas for peer assessment, self-declaration,
// and the fire-and-forget contribution logger.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRIBUTION_ACTION_TYPES = [
  "COMMENT",
  "STATUS_CHANGE",
  "PAGE_VIEW",
  "LOGIN",
] as const;
export type ContributionActionTypeInput = (typeof CONTRIBUTION_ACTION_TYPES)[number];

/**
 * Peer contribution is rated on a coarse 1–5 activity scale
 * (1 = tidak aktif langsung … 5 = sangat aktif). Stored raw as 1–5; the lecturer
 * views normalise it to 0–100% for display via peerScoreToPercent below.
 */
export const PEER_SCORE_MIN = 1;
export const PEER_SCORE_MAX = 5;

/** Labels for the 1–5 scale, index 0 = score 1. Used by the student rating UI. */
export const PEER_SCORE_LABELS = [
  "Tidak aktif langsung",
  "Kurang aktif",
  "Sederhana",
  "Aktif",
  "Sangat aktif",
] as const;

/**
 * Map a raw 1–5 peer score (or their average) to a 0–100 percentage for the
 * lecturer-facing views: 1 → 0%, 3 → 50%, 5 → 100%. Accepts fractional averages.
 */
export function peerScoreToPercent(score: number): number {
  const clamped = Math.max(PEER_SCORE_MIN, Math.min(PEER_SCORE_MAX, score));
  return ((clamped - PEER_SCORE_MIN) / (PEER_SCORE_MAX - PEER_SCORE_MIN)) * 100;
}

/** One rating row inside a peer-assessment submission. */
export const peerRatingSchema = z.object({
  rateeId: idSchema,
  score: z.coerce.number().int().min(PEER_SCORE_MIN).max(PEER_SCORE_MAX),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const submitPeerAssessmentSchema = z.object({
  tugasanId: idSchema,
  ratings: z.array(peerRatingSchema).min(1, "Tiada penilaian untuk dihantar.").max(20),
});

export const submitSelfDeclarationSchema = z.object({
  tugasanId: idSchema,
  description: z
    .string()
    .trim()
    .min(1, "Sila terangkan sumbangan anda.")
    .max(4000),
});

export const logContributionSchema = z.object({
  groupId: idSchema,
  actionType: z.enum(CONTRIBUTION_ACTION_TYPES),
  tugasanId: idSchema.optional(),
});

export type SubmitPeerAssessmentInput = z.infer<typeof submitPeerAssessmentSchema>;
export type SubmitSelfDeclarationInput = z.infer<typeof submitSelfDeclarationSchema>;
export type LogContributionInput = z.infer<typeof logContributionSchema>;

// ── Read-model result shapes ────────────────────────────────────────────────

/** Per-member contribution scoring returned by getContributionScore. */
export type ContributionScore = {
  userId: number;
  name: string;
  matricNum: string | null;
  /**
   * Avg peer score received, normalised to 0–100% (self-ratings excluded,
   * outliers trimmed). Null = none yet. Underlying ratings are on the 1–5 scale;
   * this is peerScoreToPercent() of their trimmed mean.
   */
  peerScore: number | null;
  /** Activity count normalised against the group average (1.0 = group average). */
  activityScore: number;
  /** Raw activity count, for display. */
  activityCount: number;
  /** True only when BOTH peerScore and activityScore fall below 60% of the group average. */
  riskFlag: boolean;
};

/** Who in a group has / hasn't submitted their peer ratings for a tugasan. */
export type PeerAssessmentStatus = {
  memberId: number;
  name: string;
  matricNum: string | null;
  submitted: boolean;
};
