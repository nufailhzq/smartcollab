import path from "node:path";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";

export const SUBMISSION_UPLOAD_DIR_REL = "public/uploads/submissions";
export const SUBMISSION_PUBLIC_URL_BASE = "/api/uploads/submissions";

/** Submitted assignment files: PDF, Office docs, archives, images. Up to 10MB. */
export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024;

export type SubmissionUpload = {
  /** Public URL stored on the Submission row, e.g. /api/uploads/submissions/<file> */
  path: string;
  /** Original filename, preserved for display/download. */
  name: string;
};

/** Strip directory parts and keep a filesystem-safe original name for display. */
function sanitizeName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "fail";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "fail";
}

/**
 * Persist a student submission file to /public/uploads/submissions and return
 * the public path + original name. The stored filename keeps the original name
 * after a "__" delimiter so the serving route can offer a meaningful download.
 */
export async function saveSubmissionFile(
  file: File,
): Promise<{ ok: true; data: SubmissionUpload } | { ok: false; error: string }> {
  if (file.size === 0) {
    return { ok: false, error: "Fail kosong." };
  }
  if (file.size > MAX_SUBMISSION_FILE_BYTES) {
    return { ok: false, error: "Saiz fail melebihi 10MB." };
  }

  const original = sanitizeName(file.name);
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}__${original}`;

  const abs = path.join(process.cwd(), SUBMISSION_UPLOAD_DIR_REL);
  await fs.mkdir(abs, { recursive: true });
  await fs.writeFile(path.join(abs, filename), Buffer.from(await file.arrayBuffer()));

  return {
    ok: true,
    data: {
      path: `${SUBMISSION_PUBLIC_URL_BASE}/${filename}`,
      name: original,
    },
  };
}

/** Recover the original display name from a stored submission path/filename. */
export function submissionDisplayName(publicPathOrName: string | null): string {
  if (!publicPathOrName) return "fail";
  const tail = publicPathOrName.split(/[\\/]/).pop() ?? publicPathOrName;
  const idx = tail.indexOf("__");
  return idx >= 0 ? tail.slice(idx + 2) : tail;
}
