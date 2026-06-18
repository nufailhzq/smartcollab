"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/notifications";
import { idSchema } from "@/schemas/common";
import type { ActionResult } from "@/schemas/common";

const sendWarningsSchema = z.object({
  courseId: idSchema,
  studentIds: z.array(idSchema).min(1, "Pilih sekurang-kurangnya 1 pelajar."),
  message: z.string().trim().min(5, "Mesej terlalu pendek.").max(800),
});

/**
 * Special link tag so the student dashboard can filter warning notifications.
 *
 * Important:
 * Do NOT export this from a "use server" file.
 * Next.js only allows async functions to be exported from server action files.
 */
const WARNING_LINK_TAG = "warning";

export async function sendInactivityWarnings(
  raw: unknown,
): Promise<ActionResult<{ count: number }>> {
  const session = await auth();

  if (!session) {
    return {
      ok: false,
      error: "Sesi tidak sah.",
    };
  }

  const parsed = sendWarningsSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak sah.",
    };
  }

  const { courseId, studentIds, message } = parsed.data;

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
      code: true,
      title: true,
      lecturerId: true,
    },
  });

  if (!course) {
    return {
      ok: false,
      error: "Kursus tidak wujud.",
    };
  }

  const isOwner = course.lecturerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return {
      ok: false,
      error: "Anda bukan pensyarah kursus ini.",
    };
  }

  /**
   * Defence-in-depth:
   * Only allow warnings to be sent to students who are actually enrolled
   * in this course.
   */
  const enrolled = await prisma.classEnrollment.findMany({
    where: {
      courseId: course.id,
      studentId: {
        in: studentIds,
      },
    },
    select: {
      studentId: true,
    },
  });

  const validIds = enrolled.map((enrollment) => enrollment.studentId);

  if (validIds.length === 0) {
    return {
      ok: false,
      error: "Tiada pelajar sah dipilih.",
    };
  }

  await notifyMany(validIds, {
    title: `Amaran (${course.code}): ${session.user.name}`,
    message,
    link: WARNING_LINK_TAG,
  });

  revalidatePath("/student");
  revalidatePath("/lecturer/pemantauan");

  return {
    ok: true,
    data: {
      count: validIds.length,
    },
  };
}