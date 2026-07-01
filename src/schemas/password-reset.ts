import { z } from "zod";

// Forgot-password: request a reset link by matric OR email.
export const requestResetSchema = z.object({
  identifier: z.string().trim().min(3, "Masukkan no. matrik atau e-mel.").max(120),
});

// Forgot-password: submit the new password with the emailed token.
export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10),
    password: z.string().min(6, "Kata laluan sekurang-kurangnya 6 aksara.").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Kata laluan tidak sepadan.",
    path: ["confirm"],
  });

// Profile change-password: verify the current password, then set a new one.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Masukkan kata laluan semasa."),
    password: z.string().min(6, "Kata laluan sekurang-kurangnya 6 aksara.").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Kata laluan tidak sepadan.",
    path: ["confirm"],
  });

export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
