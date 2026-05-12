import { z } from "zod";
import { idSchema } from "./common";

export const toggleCourseGroupsLockedSchema = z.object({
  courseId: idSchema,
  locked: z.boolean(),
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
export type RequestJoinGroupInput = z.infer<typeof requestJoinGroupSchema>;
export type RequestLeaveGroupInput = z.infer<typeof requestLeaveGroupSchema>;
