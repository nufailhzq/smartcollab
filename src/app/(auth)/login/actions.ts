"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { z } from "zod";

const inputSchema = z.object({
  matric: z.string().trim().min(3, "No. matrik diperlukan."),
  password: z.string().min(3, "Kata laluan diperlukan."),
});

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(raw: unknown): Promise<LoginResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  try {
    await signIn("credentials", {
      matric: parsed.data.matric.toUpperCase(),
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "No. matrik atau kata laluan salah." };
      }
      return { ok: false, error: "Ralat pengesahan. Sila cuba lagi." };
    }
    throw err;
  }
}
