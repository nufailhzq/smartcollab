"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany, notifyUser } from "@/lib/notifications";
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

  const submitterId = session.user.id;
  const { assignmentId, filePath } = parsed.data;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          lecturerId: true,
          enrollments: { where: { studentId: submitterId }, select: { id: true } },
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
  const submittedAt = new Date();

  // For GROUP assignments, propagate the same submission to every group member.
  // For INDIVIDUAL, only the submitter gets a row.
  let recipientIds: number[] = [submitterId];
  let groupName: string | null = null;

  if (assignment.type === "GROUP") {
    const group = await prisma.projectGroup.findFirst({
      where: {
        courseId: assignment.course.id,
        members: { some: { studentId: submitterId } },
      },
      include: { members: { select: { studentId: true } } },
    });
    if (!group) {
      return {
        ok: false,
        error: "Tugasan kumpulan tetapi anda belum berada dalam mana-mana kumpulan kursus ini.",
      };
    }
    groupName = group.name;
    recipientIds = group.members.map((m) => m.studentId);
    // Ensure submitter is in the list even if a transient race removed them.
    if (!recipientIds.includes(submitterId)) recipientIds.push(submitterId);
  }

  await prisma.$transaction(
    recipientIds.map((studentId) =>
      prisma.submission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        update: { filePath, status, submittedAt, submittedById: submitterId },
        create: {
          assignmentId,
          studentId,
          filePath,
          status,
          submittedAt,
          submittedById: submitterId,
        },
      }),
    ),
  );

  // Confirmation to the submitter.
  await notifyUser(submitterId, {
    title: "Penghantaran Berjaya",
    message:
      assignment.type === "GROUP" && groupName
        ? `Tugasan "${assignment.title}" untuk ${groupName} telah dihantar bagi pihak kumpulan.`
        : `Tugasan "${assignment.title}" (${assignment.course.code}) telah dihantar.`,
    link: "submissions",
  });

  // Notify other group members so they know the submission was made on their behalf.
  if (assignment.type === "GROUP" && recipientIds.length > 1) {
    const otherMembers = recipientIds.filter((id) => id !== submitterId);
    await notifyMany(otherMembers, {
      title: "Tugasan Kumpulan Dihantar",
      message: `${session.user.name} telah menghantar "${assignment.title}" bagi pihak ${groupName ?? "kumpulan"}.`,
      link: "submissions",
    });
  }

  if (assignment.course.lecturerId) {
    await notifyUser(assignment.course.lecturerId, {
      title: "Penghantaran Baru Diterima",
      message:
        assignment.type === "GROUP" && groupName
          ? `${session.user.name} (untuk ${groupName}) menghantar "${assignment.title}".`
          : `${session.user.name} menghantar "${assignment.title}".`,
      link: "submissions",
    });
  }

  revalidatePath("/student");
  revalidatePath("/student/tugasan");
  revalidatePath(`/student/tugasan/${assignmentId}`);
  revalidatePath(`/student/kursus/${assignment.course.code}`);
  revalidatePath("/lecturer");
  revalidatePath("/lecturer/penghantaran");
  return { ok: true };
}
