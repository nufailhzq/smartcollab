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

/** One rating row inside a peer-assessment submission. */
export const peerRatingSchema = z.object({
  rateeId: idSchema,
  score: z.coerce.number().int().min(0).max(100),
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
  /** Avg peer score received (self-ratings excluded, outliers trimmed). Null = none yet. */
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
