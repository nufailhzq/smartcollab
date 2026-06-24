"use server";

import path from "node:path";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyEnrolledStudents, notifyMany } from "@/lib/notifications";
import { recipientsFor } from "@/lib/recipients";
import { randomGroups } from "@/lib/random-groups";
import {
  createAssignmentSchema,
  createCourseContentSchema,
  deleteAssignmentSchema,
  deleteCourseContentSchema,
} from "@/schemas/content";
import type { ActionResult } from "@/schemas/common";

// Allowed document types for course materials (Notes / Materials tabs).
const ALLOWED_MATERIAL_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_MATERIAL_BYTES = 25 * 1024 * 1024; // 25 MB
const MATERIAL_DIR_REL = "public/uploads/materials";
const MATERIAL_URL_BASE = "/uploads/materials";

async function saveMaterial(file: File): Promise<
  | { ok: true; filePath: string; fileName: string; fileSize: string }
  | { ok: false; error: string }
> {
  if (!ALLOWED_MATERIAL_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Format fail tidak disokong. Gunakan PDF, DOC, atau DOCX.",
    };
  }
  if (file.size > MAX_MATERIAL_BYTES) {
    return { ok: false, error: "Saiz fail melebihi 25MB." };
  }
  const ext = (file.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const safeExt = ["pdf", "doc", "docx"].includes(ext) ? ext : "bin";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt}`;
  const abs = path.join(process.cwd(), MATERIAL_DIR_REL);
  await fs.mkdir(abs, { recursive: true });
  await fs.writeFile(
    path.join(abs, filename),
    Buffer.from(await file.arrayBuffer()),
  );
  return {
    ok: true,
    filePath: `${MATERIAL_URL_BASE}/${filename}`,
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
  };
}

async function deleteMaterialFile(publicPath: string) {
  if (!publicPath.startsWith(MATERIAL_URL_BASE + "/")) return;
  const filename = publicPath.slice(MATERIAL_URL_BASE.length + 1);
  if (filename.includes("/") || filename.includes("..")) return;
  try {
    await fs.unlink(path.join(process.cwd(), MATERIAL_DIR_REL, filename));
  } catch {
    /* missing is fine */
  }
}

async function ensureOwnsCourse(courseId: number, lecturerId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, lecturerId: true, title: true },
  });
  if (!course || course.lecturerId !== lecturerId) return null;
  return course;
}

export async function createCourseContent(
  input: FormData | unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  // Accept both legacy object payload and new FormData (with file).
  let raw: Record<string, unknown>;
  let attachment: File | null = null;
  if (input instanceof FormData) {
    raw = {
      courseId: Number(input.get("courseId")),
      type: String(input.get("type") ?? "GENERAL"),
      title: String(input.get("title") ?? ""),
      content: String(input.get("content") ?? ""),
      fileName: String(input.get("fileName") ?? ""),
    };
    const f = input.get("file");
    if (f instanceof File && f.size > 0) attachment = f;
  } else {
    raw = input as Record<string, unknown>;
  }

  const parsed = createCourseContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const lecturerId = session.user.id;
  const course = await ensureOwnsCourse(parsed.data.courseId, lecturerId);
  if (!course) return { ok: false, error: "Anda bukan pensyarah kursus ini." };

  // Save the uploaded file (if any). Validates PDF/DOC/DOCX + 25 MB cap.
  let filePath: string | null = null;
  let storedFileName = parsed.data.fileName || null;
  let storedFileSize: string | null = null;
  if (attachment) {
    const saved = await saveMaterial(attachment);
    if (!saved.ok) return { ok: false, error: saved.error };
    filePath = saved.filePath;
    storedFileName = saved.fileName;
    storedFileSize = saved.fileSize;
  }

  await prisma.courseContent.create({
    data: {
      courseId: course.id,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content || null,
      fileName: storedFileName,
      fileSize: storedFileSize,
      filePath,
      postedById: lecturerId,
    },
  });

  // Notify enrolled students about announcements / new notes
  if (parsed.data.type === "ANNOUNCEMENT" || parsed.data.type === "NOTES") {
    await notifyEnrolledStudents(course.id, {
      title:
        parsed.data.type === "ANNOUNCEMENT"
          ? `Pengumuman Baharu — ${course.code}`
          : `Bahan Pembelajaran Baharu — ${course.code}`,
      message: parsed.data.title,
      link: "course",
    });
  }

  revalidatePath(`/student/kursus/${course.code}`);
  revalidatePath(`/lecturer/kursus/${course.code}`);
  return { ok: true };
}

export async function deleteCourseContent(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = deleteCourseContentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const content = await prisma.courseContent.findUnique({
    where: { id: parsed.data.contentId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!content) return { ok: false, error: "Kandungan tidak wujud." };
  if (content.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.courseContent.delete({ where: { id: content.id } });
  if (content.filePath) await deleteMaterialFile(content.filePath);
  revalidatePath(`/student/kursus/${content.course.code}`);
  revalidatePath(`/lecturer/kursus/${content.course.code}`);
  return { ok: true };
}

export async function createAssignment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = createAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const lecturerId = session.user.id;
  const course = await ensureOwnsCourse(parsed.data.courseId, lecturerId);
  if (!course) return { ok: false, error: "Anda bukan pensyarah kursus ini." };

  const { groupingMode } = parsed.data;

  const roster = (
    await prisma.classEnrollment.findMany({
      where: { courseId: course.id },
      select: { studentId: true },
    })
  ).map((r) => r.studentId);
  const rosterSet = new Set(roster);

  // Build the ad-hoc group rows BEFORE any write, so validation can reject the
  // whole creation atomically. Standing groups (assignmentId null) are never
  // read or mutated here — ad-hoc groups are separate rows keyed by assignmentId.
  let adHocGroups: { name: string; memberIds: number[] }[] = [];

  if (groupingMode === "CUSTOM") {
    adHocGroups = parsed.data.groups ?? [];
    const seen = new Set<number>();
    for (const g of adHocGroups) {
      for (const id of g.memberIds) {
        if (!rosterSet.has(id)) {
          return { ok: false, error: "Seorang ahli tidak berdaftar dalam kursus ini." };
        }
        if (seen.has(id)) {
          return { ok: false, error: "Seorang pelajar diletak dalam lebih daripada satu kumpulan." };
        }
        seen.add(id);
      }
    }
    // Rule 3: the resolved members must equal the enrolled roster — no student
    // may fall through the cracks. Reject if anyone is left unassigned.
    const missing = roster.filter((id) => !seen.has(id));
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Setiap pelajar mesti diletakkan dalam satu kumpulan. ${missing.length} pelajar belum dikumpulkan.`,
      };
    }
  } else if (groupingMode === "RANDOM") {
    adHocGroups = randomGroups(roster, parsed.data.groupSize ?? 4, parsed.data.title);
  }

  // Create the assignment and its ad-hoc groups in ONE transaction so a partial
  // failure can't leave an orphaned assignment or a half-built grouping.
  const assignment = await prisma.$transaction(async (tx) => {
    const created = await tx.assignment.create({
      data: {
        courseId: course.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        type: parsed.data.type,
        groupingMode,
        dueDate: new Date(parsed.data.dueDate),
        maxGrade: parsed.data.maxGrade,
      },
    });
    for (const g of adHocGroups) {
      await tx.projectGroup.create({
        data: {
          courseId: course.id,
          name: g.name,
          status: "APPROVED",
          createdById: lecturerId,
          assignmentId: created.id,
          members: {
            create: g.memberIds.map((studentId) => ({ studentId, role: "MEMBER" })),
          },
        },
      });
    }
    return created;
  });

  const recipientIds = await recipientsFor(assignment);
  await notifyMany(recipientIds, {
    title: `Tugasan Baharu — ${course.code}`,
    message: parsed.data.title,
    link: "assignments",
  });

  revalidatePath(`/student/kursus/${course.code}`);
  revalidatePath(`/student/tugasan`);
  revalidatePath(`/lecturer/kursus/${course.code}`);
  revalidatePath(`/lecturer/penghantaran`);
  return { ok: true };
}

export async function deleteAssignment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = deleteAssignmentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const a = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!a) return { ok: false, error: "Tugasan tidak wujud." };
  if (a.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.assignment.delete({ where: { id: a.id } });
  revalidatePath(`/student/kursus/${a.course.code}`);
  revalidatePath(`/lecturer/kursus/${a.course.code}`);
  revalidatePath(`/lecturer/penghantaran`);
  return { ok: true };
}
