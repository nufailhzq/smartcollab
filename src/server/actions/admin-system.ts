"use server";

import path from "node:path";
import { spawn } from "node:child_process";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/schemas/common";

async function ensureAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "ADMIN") return { ok: false, error: "Tidak dibenarkan." };
  return { ok: true };
}

type ReseedResult = {
  exitCode: number;
  durationMs: number;
  output: string;
};

function runSeed(): Promise<ReseedResult> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const cwd = process.cwd();
    const seedPath = path.join(cwd, "prisma", "seed.ts");
    const isWindows = process.platform === "win32";
    // `npx tsx` works cross-platform; on Windows we must shell out so PATH resolution
    // picks up the .cmd shim. We never interpolate user input into the command.
    const child = spawn("npx", ["--no-install", "tsx", seedPath], {
      cwd,
      env: process.env,
      shell: isWindows,
    });

    const chunks: string[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 200_000;
    const append = (buf: Buffer) => {
      if (totalBytes >= MAX_BYTES) return;
      const piece = buf.toString("utf8");
      totalBytes += Buffer.byteLength(piece);
      chunks.push(piece);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        exitCode: code ?? -1,
        durationMs: Date.now() - started,
        output: chunks.join(""),
      });
    });
  });
}

export async function reseedDatabase(): Promise<ActionResult<ReseedResult>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_RESEED !== "1") {
    return {
      ok: false,
      error: "Reseed dilumpuhkan dalam pengeluaran. Tetapkan ALLOW_ADMIN_RESEED=1 untuk membenarkan.",
    };
  }

  try {
    const result = await runSeed();
    revalidatePath("/admin");
    revalidatePath("/admin/sistem");
    revalidatePath("/admin/pengguna");
    revalidatePath("/admin/kursus");
    if (result.exitCode !== 0) {
      return {
        ok: false,
        error: `Seed gagal (exit ${result.exitCode}). Lihat log konsol pelayan untuk butiran.`,
      };
    }
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reseed gagal.";
    return { ok: false, error: msg };
  }
}
