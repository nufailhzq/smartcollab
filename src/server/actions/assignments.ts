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

  // Hard cutoff (separate from the soft dueDate). Past dueDate alone is fine —
  // it's just marked LATE. But if the lecturer has closed submissions and that
  // moment has passed, block the upload.
  if (assignment.submissionCloseAt && new Date() > assignment.submissionCloseAt) {
    return { ok: false, error: "Penghantaran untuk tugasan ini telah ditutup." };
  }

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

    // Contribution gate (submitter only): the person submitting on behalf of the
    // group must have filled their Sumbangan Sendiri AND rated every teammate in
    // Penilaian Rakan Sekumpulan before the group work can be sent.
    const teammateIds = recipientIds.filter((id) => id !== submitterId);
    const [selfDone, ratedCount] = await Promise.all([
      prisma.selfDeclaredContribution.findUnique({
        where: { userId_tugasanId: { userId: submitterId, tugasanId: assignmentId } },
        select: { id: true },
      }),
      teammateIds.length === 0
        ? Promise.resolve(0)
        : prisma.peerAssessment.count({
            where: {
              tugasanId: assignmentId,
              raterId: submitterId,
              rateeId: { in: teammateIds },
            },
          }),
    ]);
    if (!selfDone) {
      return {
        ok: false,
        error: "Sila isi Sumbangan Sendiri anda sebelum menghantar tugasan kumpulan.",
      };
    }
    if (teammateIds.length > 0 && ratedCount < teammateIds.length) {
      return {
        ok: false,
        error: "Sila lengkapkan Penilaian Rakan Sekumpulan bagi semua ahli sebelum menghantar.",
      };
    }
  }

  // Save the uploaded file only after every gate above has passed (so a rejected
  // submission never leaves an orphaned file).
  const saved = await saveSubmissionFile(file);
  if (!saved.ok) return { ok: false, error: saved.error };
  const filePath = saved.data.path;

  const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;
  const status = isLate ? "LATE" : "SUBMITTED";
  const submittedAt = new Date();

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

  // Notify other group members that the work was submitted AND that they now
  // need to give their own peer assessment + self-declaration for this tugasan.
  if (assignment.type === "GROUP" && recipientIds.length > 1) {
    const otherMembers = recipientIds.filter((id) => id !== submitterId);
    await notifyMany(otherMembers, {
      title: "Beri Penilaian Rakan Sekumpulan",
      message: `${session.user.name} telah menghantar "${assignment.title}" bagi pihak ${groupName ?? "kumpulan"}. Sila lengkapkan Sumbangan Sendiri dan Penilaian Rakan Sekumpulan anda.`,
      link: `student/tugasan/${assignmentId}`,
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
