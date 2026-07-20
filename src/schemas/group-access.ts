import { z } from "zod";
import { idSchema } from "./common";

export const toggleCourseGroupsLockedSchema = z.object({
  courseId: idSchema,
  locked: z.boolean(),
});

export const setGroupFormationSettingsSchema = z.object({
  courseId: idSchema,
  /** true = students form groups instantly (no lecturer approval). */
  selfService: z.boolean(),
  /** Member cap for student-formed groups; null clears back to the default. */
  maxMembers: z.coerce.number().int().min(1).max(50).nullable(),
  /** ISO datetime after which no new groups may be formed; null = no cutoff. */
  closeAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const requestJoinGroupSchema = z.object({
  groupId: idSchema,
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const requestLeaveGroupSchema = z.object({
  groupId: idSchema,
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const respondAccessRequestSchema = z.object({
  requestId: idSchema,
});

export const cancelAccessRequestSchema = z.object({
  requestId: idSchema,
});

export type ToggleCourseGroupsLockedInput = z.infer<typeof toggleCourseGroupsLockedSchema>;
export type SetGroupFormationSettingsInput = z.infer<typeof setGroupFormationSettingsSchema>;
export type RequestJoinGroupInput = z.infer<typeof requestJoinGroupSchema>;
export type RequestLeaveGroupInput = z.infer<typeof requestLeaveGroupSchema>;
