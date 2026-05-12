import { z } from "zod";
import { idSchema } from "./common";

export const joinGroupSchema = z.object({ groupId: idSchema });
export const leaveGroupSchema = z.object({ groupId: idSchema });

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type LeaveGroupInput = z.infer<typeof leaveGroupSchema>;
