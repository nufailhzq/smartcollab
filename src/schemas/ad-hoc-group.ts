import { z } from "zod";
import { idSchema } from "./common";

// ─────────────────────────────────────────────────────────────────────────────
// Student self-service ad-hoc grouping (SELF mode = GroupingMode.CUSTOM with
// student self-organization). Every invite rejection is a TYPED reason so the
// UI can render an exact, localized message and disable the right control —
// never a stringly-typed `any`.
// ─────────────────────────────────────────────────────────────────────────────

export const createAdHocGroupSchema = z.object({
  assignmentId: idSchema,
  /** Optional custom name; falls back to an auto-generated one when omitted. */
  name: z.string().trim().min(1).max(120).optional(),
});

export const listInvitablePoolSchema = z.object({
  assignmentId: idSchema,
});

export const inviteSchema = z.object({
  groupId: idSchema,
  inviteeId: idSchema,
});

export const respondToInviteSchema = z.object({
  inviteId: idSchema,
  action: z.enum(["ACCEPT", "DECLINE"]),
});

export const cancelInviteSchema = z.object({
  inviteId: idSchema,
});

export type CreateAdHocGroupInput = z.infer<typeof createAdHocGroupSchema>;
export type ListInvitablePoolInput = z.infer<typeof listInvitablePoolSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type RespondToInviteInput = z.infer<typeof respondToInviteSchema>;
export type CancelInviteInput = z.infer<typeof cancelInviteSchema>;

/**
 * Why a student is NOT invitable into an ad-hoc group for an assignment.
 * - IN_GROUP        — already a confirmed member of an ad-hoc group here.
 * - ALREADY_INVITED — already has a PENDING invite for this assignment.
 */
export type NonInvitableReason = "IN_GROUP" | "ALREADY_INVITED";

/**
 * Typed failure codes for invite()/respondToInvite(). The action returns the
 * code; the UI maps it to a localized message. No `any`, no free-form strings.
 */
export type InviteErrorCode =
  | "NOT_SELF_MODE"
  | "NOT_ENROLLED"
  | "INVITEE_NOT_ENROLLED"
  | "GROUP_NOT_FOUND"
  | "GROUP_FULL"
  | "INVITEE_IN_GROUP"
  | "INVITEE_ALREADY_INVITED"
  | "NOT_GROUP_MEMBER"
  | "INVITE_NOT_FOUND"
  | "INVITE_NOT_PENDING"
  | "NOT_INVITEE"
  | "SELF_INVITE";

/** A pool entry the UI renders as a non-invitable, reason-tagged chip. */
export type PoolStudent = {
  id: number;
  name: string;
  matricNum: string | null;
  avatarPath: string | null;
};

export type InvitablePool = {
  invitable: PoolStudent[];
  nonInvitable: { student: PoolStudent; reason: NonInvitableReason }[];
};
