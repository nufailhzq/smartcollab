"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { submitAssignmentSchema } from "@/schemas/assignment";
import type { ActionResult } from "@/schemas/common";

export async function submitAssignment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh menghantar tugasan." };
  }

  const parsed = submitAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const studentId = session.user.id;
  const { assignmentId, filePath } = parsed.data;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          lecturerId: true,
          enrollments: { where: { studentId }, select: { id: true } },
        },
      },
    },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (assignment.course.enrollments.length === 0) {
    return { ok: false, error: "Anda tidak berdaftar dalam kursus ini." };
  }

  const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;
  const status = isLate ? "LATE" : "SUBMITTED";

  await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    update: { filePath, status, submittedAt: new Date() },
    create: { assignmentId, studentId, filePath, status },
  });

  await notifyUser(studentId, {
    title: "Penghantaran Berjaya",
    message: `Tugasan "${assignment.title}" (${assignment.course.code}) telah dihantar.`,
    link: "submissions",
  });
  if (assignment.course.lecturerId) {
    await notifyUser(assignment.course.lecturerId, {
      title: "Penghantaran Baru Diterima",
      message: `${session.user.name} menghantar "${assignment.title}".`,
      link: "submissions",
    });
  }

  revalidatePath("/student");
  revalidatePath("/student/tugasan");
  revalidatePath(`/student/kursus/${assignment.course.code}`);
  revalidatePath("/lecturer");
  revalidatePath("/lecturer/penghantaran");
  return { ok: true };
}
