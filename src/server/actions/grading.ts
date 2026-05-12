"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { gradeSubmissionSchema } from "@/schemas/grading";
import type { ActionResult } from "@/schemas/common";

export async function gradeSubmission(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") {
    return { ok: false, error: "Hanya pensyarah boleh memberi markah." };
  }

  const parsed = gradeSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const lecturerId = session.user.id;
  const { submissionId, grade, feedback } = parsed.data;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { select: { courseId: true, maxGrade: true, title: true } },
    },
  });
  if (!submission) return { ok: false, error: "Penghantaran tidak wujud." };

  // Authorize: lecturer must own the course this assignment belongs to
  const course = await prisma.course.findUnique({
    where: { id: submission.assignment.courseId },
    select: { lecturerId: true, code: true },
  });
  if (!course || course.lecturerId !== lecturerId) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  const max = submission.assignment.maxGrade ?? 100;
  if (grade > max) {
    return { ok: false, error: `Markah melebihi maksimum (${max}).` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submissionId },
      data: { grade, status: "GRADED" },
    });
    if (feedback && feedback.trim().length > 0) {
      await tx.submissionFeedback.create({
        data: { submissionId, lecturerId, comment: feedback.trim() },
      });
    }
  });

  await notifyUser(submission.studentId, {
    title: "Tugasan Telah Dimarkah",
    message: `${course.code} — "${submission.assignment.title}": ${grade}/${max}.`,
    link: "submissions",
  });

  revalidatePath("/student");
  revalidatePath("/student/tugasan");
  revalidatePath("/lecturer");
  revalidatePath("/lecturer/penghantaran");
  revalidatePath(`/lecturer/kursus/${course.code}`);
  return { ok: true };
}
