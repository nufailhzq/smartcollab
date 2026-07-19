"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany, notifyUser } from "@/lib/notifications";
import { saveSubmissionFile } from "@/lib/submission-uploads";
import { logContributionForAssignment } from "@/server/actions/contribution";
import { idSchema } from "@/schemas/common";
import type { ActionResult } from "@/schemas/common";

export async function submitAssignment(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya pelajar boleh menghantar tugasan." };
  }

  const assignmentIdParsed = idSchema.safeParse(Number(formData.get("assignmentId")));
  if (!assignmentIdParsed.success) {
    return { ok: false, error: "Tugasan tidak sah." };
  }
  const assignmentId = assignmentIdParsed.data;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sila lampirkan fail." };
  }

  const submitterId = session.user.id;

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

  // Save the uploaded file only after we've confirmed the student may submit.
  const saved = await saveSubmissionFile(file);
  if (!saved.ok) return { ok: false, error: saved.error };
  const filePath = saved.data.path;

  const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;
  const status = isLate ? "LATE" : "SUBMITTED";
  const submittedAt = new Date();

  // For GROUP assignments, propagate the same submission to every group member.
  // For INDIVIDUAL, only the submitter gets a row.
  let recipientIds: number[] = [submitterId];
  let groupName: string | null = null;

  if (assignment.type === "GROUP") {
    // Resolve the submitter's group for THIS assignment's grouping context, not
    // just any course group: CUSTOM/RANDOM submit to the assignment's ad-hoc
    // group (assignmentId = this assignment); INHERIT submits to the standing
    // group (assignmentId = null). Mixing these would propagate a submission to
    // the wrong set of students.
    const groupContext =
      assignment.groupingMode === "INHERIT"
        ? { courseId: assignment.course.id, assignmentId: null }
        : { assignmentId: assignment.id };
    const group = await prisma.projectGroup.findFirst({
      where: {
        ...groupContext,
        members: { some: { studentId: submitterId } },
      },
      include: { members: { select: { studentId: true } } },
    });
    if (!group) {
      return {
        ok: false,
        error: "Tugasan kumpulan tetapi anda belum berada dalam mana-mana kumpulan untuk tugasan ini.",
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

  // Free-rider signal: record the submit as a STATUS_CHANGE contribution for
  // the submitter. Fire-and-forget — never blocks the submission.
  if (assignment.type === "GROUP") {
    void logContributionForAssignment(submitterId, assignmentId, "STATUS_CHANGE");
  }

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
