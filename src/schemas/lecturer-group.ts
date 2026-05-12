import { z } from "zod";
import { idSchema } from "./common";

export const createGroupSchema = z.object({
  courseId: idSchema,
  name: z.string().trim().min(1, "Nama kumpulan diperlukan.").max(80),
  maxMembers: z.coerce.number().int().min(2).max(10).default(5),
});

export const updateGroupSchema = z.object({
  groupId: idSchema,
  name: z.string().trim().min(1).max(80),
  maxMembers: z.coerce.number().int().min(2).max(10),
});

export const deleteGroupSchema = z.object({ groupId: idSchema });

export const assignStudentSchema = z.object({
  groupId: idSchema,
  studentId: idSchema,
  role: z.enum(["LEADER", "MEMBER"]).default("MEMBER"),
});

export const removeStudentSchema = z.object({
  groupId: idSchema,
  studentId: idSchema,
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AssignStudentInput = z.infer<typeof assignStudentSchema>;
