import { z } from "zod";
import { idSchema } from "./common";

export const createChatGroupSchema = z.object({
  name: z.string().trim().min(1, "Nama kumpulan diperlukan.").max(80),
  memberIds: z
    .array(idSchema)
    .min(1, "Pilih sekurang-kurangnya seorang ahli.")
    .max(50, "Maksimum 50 ahli."),
});

export const addChatGroupMemberSchema = z.object({
  chatGroupId: idSchema,
  userId: idSchema,
});

export const removeChatGroupMemberSchema = z.object({
  chatGroupId: idSchema,
  userId: idSchema,
});

export const leaveChatGroupSchema = z.object({ chatGroupId: idSchema });

// Content is optional — an attachment-only group message is valid.
export const sendChatGroupMessageSchema = z.object({
  chatGroupId: idSchema,
  content: z.string().trim().max(2000, "Mesej terlalu panjang.").optional().default(""),
});

export const renameChatGroupSchema = z.object({
  chatGroupId: idSchema,
  name: z.string().trim().min(1).max(80),
});

export type CreateChatGroupInput = z.infer<typeof createChatGroupSchema>;
export type SendChatGroupMessageInput = z.infer<typeof sendChatGroupMessageSchema>;
