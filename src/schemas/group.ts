import { z } from "zod";
import { idSchema } from "./common";

export const joinGroupSchema = z.object({ groupId: idSchema });
export const leaveGroupSchema = z.object({ groupId: idSchema });

export const requestGroupSchema = z.object({
  courseId: idSchema,
  name: z.string().trim().min(1, "Nama kumpulan diperlukan."),
  memberIds: z.array(idSchema),
});

export const setGroupStatusSchema = z.object({
  groupId: idSchema,
  action: z.enum(["APPROVE", "REJECT"]),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type LeaveGroupInput = z.infer<typeof leaveGroupSchema>;
export type RequestGroupInput = z.infer<typeof requestGroupSchema>;
export type SetGroupStatusInput = z.infer<typeof setGroupStatusSchema>;
