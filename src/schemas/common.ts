import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();

export type ActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };
