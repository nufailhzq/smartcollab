import { z } from "zod";
import { idSchema } from "./common";

export const POST_MAX_LENGTH = 500;
export const POST_MAX_IMAGES = 4;
export const ALLOWED_POST_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;

export const postVisibilitySchema = z.enum(["PUBLIC", "FACULTY", "FRIENDS"]);

export const createPostSchema = z.object({
  content: z.string().trim().max(POST_MAX_LENGTH),
  visibility: postVisibilitySchema.default("PUBLIC"),
});

export const repostSchema = z.object({
  postId: idSchema,
});

export const deletePostSchema = z.object({
  postId: idSchema,
});

export const COMMENT_MAX_LENGTH = 500;

export const addCommentSchema = z.object({
  postId: idSchema,
  content: z.string().trim().min(1, "Komen tidak boleh kosong.").max(COMMENT_MAX_LENGTH),
});

export const deleteCommentSchema = z.object({
  commentId: idSchema,
});

/**
 * Whitelisted reaction emojis. Keep this list short and stable so the UI
 * picker, indexes, and analytics stay consistent.
 */
export const ALLOWED_REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "🔥",
  "😮",
  "🙏",
  "🎉",
  "😢",
] as const;

export const reactionSchema = z.object({
  postId: idSchema,
  emoji: z.enum(ALLOWED_REACTIONS),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PostVisibilityValue = z.infer<typeof postVisibilitySchema>;

/**
 * Matches matric mentions inside post text. Accepts:
 *   @A201762   @a201762   (with or without trailing punctuation)
 * Captured group 1 = the matric number (case-preserved).
 */
export const MATRIC_MENTION_REGEX = /@([Aa]\d{6})/g;

export function extractMentionedMatrics(content: string): string[] {
  const out = new Set<string>();
  for (const match of content.matchAll(MATRIC_MENTION_REGEX)) {
    out.add(match[1]!.toUpperCase());
  }
  return [...out];
}
