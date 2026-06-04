import { z } from "zod";

export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

export const PHONE_MAX_LENGTH = 32;

/**
 * Lightweight phone normalizer. We only enforce shape, not format — UKM
 * staff use a mix of "+60 12-345 6789", "012-345 6789", "03 1234 5678", etc.
 */
export const updateContactSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX_LENGTH, "Nombor telefon terlalu panjang.")
    .regex(/^[\d+\-\s()]*$/, "Hanya digit, +, -, spasi, dan kurungan dibenarkan.")
    .optional()
    .or(z.literal("")),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
