import { z } from "zod";
import { idSchema } from "./common";

const baseBulletinFields = {
  title: z.string().trim().min(2, "Tajuk diperlukan.").max(160),
  body: z.string().trim().min(2, "Kandungan diperlukan.").max(4000),
  linkUrl: z
    .string()
    .trim()
    .max(500)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || /^https?:\/\//i.test(v) || v.startsWith("/"),
      "URL mesti bermula dengan http://, https://, atau /.",
    ),
  linkLabel: z
    .string()
    .trim()
    .max(80)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  isActive: z.coerce.boolean().default(true),
  isPinned: z.coerce.boolean().default(false),
};

export const createBulletinSchema = z.object(baseBulletinFields);

export const updateBulletinSchema = z.object({
  bulletinId: idSchema,
  ...baseBulletinFields,
  /** When true, server keeps the existing imagePath even if no new file is uploaded. */
  keepImage: z.coerce.boolean().default(true),
});

export const deleteBulletinSchema = z.object({ bulletinId: idSchema });

export const toggleBulletinSchema = z.object({
  bulletinId: idSchema,
  field: z.enum(["isActive", "isPinned"]),
  value: z.coerce.boolean(),
});

export type CreateBulletinInput = z.infer<typeof createBulletinSchema>;
export type UpdateBulletinInput = z.infer<typeof updateBulletinSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
