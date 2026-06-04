import { z } from "zod";
import { idSchema } from "./common";

// Content is now optional — an attachment-only message is valid. The server
// still rejects rows where both content AND attachment are absent.
export const sendMessageSchema = z.object({
  receiverId: idSchema,
  content: z.string().trim().max(2000, "Mesej terlalu panjang.").optional().default(""),
});

export const markReadSchema = z.object({ fromUserId: idSchema });

export const ATTACHMENT_TYPES = ["image", "video", "file"] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export const ALLOWED_CHAT_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export const ALLOWED_CHAT_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CHAT_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_CHAT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB (generic files)

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
