import { z } from "zod";
import { idSchema } from "./common";

export const roleEnum = z.enum(["STUDENT", "LECTURER", "ADMIN"]);

const baseUserFields = {
  name: z.string().trim().min(2, "Nama mesti sekurang-kurangnya 2 aksara.").max(120),
  email: z
    .string()
    .trim()
    .email("Format e-mel tidak sah.")
    .max(160)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  role: roleEnum,
  matricNum: z
    .string()
    .trim()
    .min(3, "No. matrik mesti sekurang-kurangnya 3 aksara.")
    .max(32)
    .regex(/^[A-Za-z0-9]+$/, "No. matrik hanya boleh mengandungi huruf dan nombor.")
    .transform((v) => v.toUpperCase()),
  faculty: z
    .string()
    .trim()
    .max(40)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default("FTSM"),
  isActive: z.coerce.boolean().default(true),
};

export const createUserSchema = z.object({
  ...baseUserFields,
  password: z.string().min(4, "Kata laluan mesti sekurang-kurangnya 4 aksara.").max(120),
});

export const updateUserSchema = z.object({
  userId: idSchema,
  ...baseUserFields,
});

export const deleteUserSchema = z.object({ userId: idSchema });

export const toggleUserActiveSchema = z.object({
  userId: idSchema,
  isActive: z.coerce.boolean(),
});

export const resetPasswordSchema = z.object({
  userId: idSchema,
  password: z.string().min(4, "Kata laluan mesti sekurang-kurangnya 4 aksara.").max(120),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
