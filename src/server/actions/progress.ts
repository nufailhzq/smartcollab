"use server";

import { auth } from "@/lib/auth";
import {
  getCourseProgress,
  ProgressAuthError,
  type CourseProgress,
} from "@/server/queries/progress";
import type { ActionResult } from "@/schemas/common";

/**
 * Thin auth wrapper over getCourseProgress — the only entry point for client
 * callers. Holds no business logic: it resolves the session (401-equivalent if
 * unauthenticated) and delegates, mapping the helper's ownership/enrollment
 * guard (ProgressAuthError) to a 403-equivalent result.
 */
export async function fetchCourseProgress(
  courseId: number,
): Promise<ActionResult<CourseProgress>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  try {
    const data = await getCourseProgress(courseId, session.user.id, session.user.role);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ProgressAuthError) return { ok: false, error: err.message };
    throw err;
  }
}
