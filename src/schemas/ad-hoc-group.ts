import { z } from "zod";
import { idSchema } from "./common";

// ─────────────────────────────────────────────────────────────────────────────
// Student ad-hoc grouping, two mutually-exclusive modes per assignment:
//
//   CUSTOM (Mode A) — students form their own group (name + chosen friends).
//                     The group is PENDING until the lecturer approves/declines.
//   OPEN   (Mode B) — the lecturer opens empty groups; students self-join with
//                     no approval, and any member can pull a friend in (the
//                     friend auto-joins). Joining locks at the assignment's
//                     joinCloseAt.
//
// Every failure is a TYPED reason so the UI can render an exact message and
// disable the right control — never a stringly-typed `any`.
// ─────────────────────────────────────────────────────────────────────────────

/** Mode A: create a PENDING group with the creator + chosen members. */
export const createAdHocGroupSchema = z.object({
  assignmentId: idSchema,
  /** Optional custom name; falls back to an auto-generated one when omitted. */
  name: z.string().trim().min(1).max(120).optional(),
  /** Friends to include in the application (excluding the creator). */
  memberIds: z.array(idSchema).max(20).default([]),
});

/** Mode B: a student self-joins a lecturer-opened OPEN group. */
export const joinOpenGroupSchema = z.object({
  groupId: idSchema,
});

/** Mode B: a member pulls a friend into their OPEN group (friend auto-joins). */
export const inviteToOpenGroupSchema = z.object({
  groupId: idSchema,
  inviteeId: idSchema,
});

/** Mode B: a student leaves the OPEN group they're currently in. */
export const leaveOpenGroupSchema = z.object({
  groupId: idSchema,
});

/** Mode B (lecturer): open one empty self-join group for an assignment. */
export const createOpenGroupSchema = z.object({
  assignmentId: idSchema,
  name: z.string().trim().min(1).max(120).optional(),
  maxMembers: z.coerce.number().int().min(2).max(20).default(4),
});

/** Mode B (lecturer): toggle the manual "Kunci Kumpulan" lock on an assignment. */
export const setGroupsLockSchema = z.object({
  assignmentId: idSchema,
  locked: z.boolean(),
});

/** Lecturer manual override: move a student into a target group (any state). */
export const reassignStudentSchema = z.object({
  assignmentId: idSchema,
  studentId: idSchema,
  /** Target group, or null to remove the student from their current group. */
  targetGroupId: idSchema.nullable(),
});

export type CreateAdHocGroupInput = z.infer<typeof createAdHocGroupSchema>;
export type JoinOpenGroupInput = z.infer<typeof joinOpenGroupSchema>;
export type LeaveOpenGroupInput = z.infer<typeof leaveOpenGroupSchema>;
export type InviteToOpenGroupInput = z.infer<typeof inviteToOpenGroupSchema>;
export type CreateOpenGroupInput = z.infer<typeof createOpenGroupSchema>;
export type SetGroupsLockInput = z.infer<typeof setGroupsLockSchema>;
export type ReassignStudentInput = z.infer<typeof reassignStudentSchema>;

/**
 * Why a student is NOT selectable/joinable for an ad-hoc group on an assignment.
 * - IN_GROUP   — already a member of an ad-hoc group here.
 * - IN_PENDING — already part of a PENDING student-formed application here.
 */
export type NonInvitableReason = "IN_GROUP" | "IN_PENDING";

/**
 * Typed failure codes for the ad-hoc actions. The action returns the code; the
 * UI maps it to a localized message. No `any`, no free-form strings.
 */
export type AdHocErrorCode =
  | "NOT_SELF_MODE"
  | "NOT_OPEN_MODE"
  | "NOT_ENROLLED"
  | "INVITEE_NOT_ENROLLED"
  | "GROUP_NOT_FOUND"
  | "GROUP_FULL"
  | "ALREADY_IN_GROUP"
  | "INVITEE_IN_GROUP"
  | "MEMBER_IN_PENDING"
  | "INVITEE_IN_PENDING"
  | "NOT_GROUP_MEMBER"
  | "JOIN_CLOSED"
  | "GROUPS_LOCKED"
  | "NOT_IN_GROUP"
  | "SELF_INVITE";

/** A pool entry the UI renders as a selectable / reason-tagged chip. */
export type PoolStudent = {
  id: number;
  name: string;
  matricNum: string | null;
  avatarPath: string | null;
};
