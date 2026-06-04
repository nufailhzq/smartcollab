"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  toggleUserActiveSchema,
  resetPasswordSchema,
} from "@/schemas/admin-user";
import type { ActionResult } from "@/schemas/common";

async function ensureAdmin(): Promise<{ ok: true; userId: number } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "ADMIN") return { ok: false, error: "Tidak dibenarkan." };
  return { ok: true, userId: session.user.id };
}

function bumpCaches() {
  revalidatePath("/admin");
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin/sistem");
}

function prismaError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      const target = (e.meta?.target as string[] | string | undefined) ?? "";
      const t = Array.isArray(target) ? target.join(",") : String(target);
      if (t.includes("matricNum") || t.includes("fld_matric_num")) {
        return "No. matrik sudah digunakan.";
      }
      if (t.includes("email") || t.includes("fld_email")) {
        return "E-mel sudah digunakan.";
      }
      return "Nilai unik sudah wujud.";
    }
    if (e.code === "P2003") {
      return "Pengguna masih mempunyai rekod berkaitan.";
    }
  }
  return "Operasi gagal.";
}

export async function createUser(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  try {
    const hash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        matricNum: parsed.data.matricNum,
        faculty: parsed.data.faculty ?? "FTSM",
        isActive: parsed.data.isActive,
        passwordHash: hash,
      },
    });
  } catch (e) {
    return { ok: false, error: prismaError(e) };
  }

  bumpCaches();
  return { ok: true };
}

export async function updateUser(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: "Pengguna tidak wujud." };

  // Prevent demoting the last active admin
  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (activeAdmins <= 1) {
      return { ok: false, error: "Tidak boleh tukar peranan: pentadbir aktif terakhir." };
    }
  }
  if (target.role === "ADMIN" && !parsed.data.isActive) {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (activeAdmins <= 1) {
      return { ok: false, error: "Tidak boleh nyahaktifkan pentadbir aktif terakhir." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        matricNum: parsed.data.matricNum,
        faculty: parsed.data.faculty ?? "FTSM",
        isActive: parsed.data.isActive,
      },
    });
  } catch (e) {
    return { ok: false, error: prismaError(e) };
  }

  bumpCaches();
  return { ok: true };
}

export async function deleteUser(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = deleteUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  if (parsed.data.userId === gate.userId) {
    return { ok: false, error: "Tidak boleh padam akaun anda sendiri." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) return { ok: false, error: "Pengguna tidak wujud." };

  if (target.role === "ADMIN" && target.isActive) {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (activeAdmins <= 1) {
      return { ok: false, error: "Tidak boleh padam pentadbir aktif terakhir." };
    }
  }

  try {
    await prisma.user.delete({ where: { id: parsed.data.userId } });
  } catch (e) {
    return { ok: false, error: prismaError(e) };
  }

  bumpCaches();
  return { ok: true };
}

export async function toggleUserActive(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = toggleUserActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  if (parsed.data.userId === gate.userId && !parsed.data.isActive) {
    return { ok: false, error: "Tidak boleh nyahaktifkan akaun anda sendiri." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true, isActive: true },
  });
  if (!target) return { ok: false, error: "Pengguna tidak wujud." };

  if (target.role === "ADMIN" && target.isActive && !parsed.data.isActive) {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (activeAdmins <= 1) {
      return { ok: false, error: "Tidak boleh nyahaktifkan pentadbir aktif terakhir." };
    }
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { isActive: parsed.data.isActive },
  });

  bumpCaches();
  return { ok: true };
}

export async function resetUserPassword(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const exists = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Pengguna tidak wujud." };

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash: hash },
  });

  bumpCaches();
  return { ok: true };
}
