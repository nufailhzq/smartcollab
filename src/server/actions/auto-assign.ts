"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/schemas/common";
import type { ActionResult } from "@/schemas/common";
import { notifyMany } from "@/lib/notifications";
import { z } from "zod";

const autoAssignSchema = z.object({
  courseId: idSchema,
  /** If true, ungrouped students that don't fit existing groups go into new auto-created groups. */
  createGroupsIfNeeded: z.coerce.boolean().default(true),
  /** Cap on a new group's size when creating. Existing groups still respect their own maxMembers. */
  defaultGroupSize: z.coerce.number().int().min(2).max(10).default(5),
});

export type AutoAssignResult = {
  assignedCount: number;
  groupsTouched: number;
  groupsCreated: number;
  ungroupedRemaining: number;
};

export async function autoAssignUngrouped(
  raw: unknown,
): Promise<ActionResult<AutoAssignResult>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = autoAssignSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, code: true, lecturerId: true },
  });
  if (!course) return { ok: false, error: "Kursus tidak wujud." };

  const isOwner = course.lecturerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  // Snapshot current state in one round-trip.
  const [enrollments, groups, existingMembers] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: { courseId: course.id },
      select: { studentId: true },
    }),
    prisma.projectGroup.findMany({
      where: { courseId: course.id },
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.groupMember.findMany({
      where: { group: { courseId: course.id } },
      select: { studentId: true },
    }),
  ]);

  const groupedStudentIds = new Set(existingMembers.map((m) => m.studentId));
  const ungrouped = enrollments
    .map((e) => e.studentId)
    .filter((id) => !groupedStudentIds.has(id));

  if (ungrouped.length === 0) {
    return {
      ok: true,
      data: { assignedCount: 0, groupsTouched: 0, groupsCreated: 0, ungroupedRemaining: 0 },
    };
  }

  // Shuffle deterministically-ish so re-runs don't always pick the same student first.
  for (let i = ungrouped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ungrouped[i], ungrouped[j]] = [ungrouped[j]!, ungrouped[i]!];
  }

  // Round-robin into existing groups with capacity (smallest first to balance).
  type Slot = { groupId: number; capacity: number; size: number };
  const slots: Slot[] = groups
    .map((g) => ({
      groupId: g.id,
      capacity: g.maxMembers,
      size: g._count.members,
    }))
    .filter((s) => s.size < s.capacity)
    .sort((a, b) => a.size - b.size || a.groupId - b.groupId);

  const assignments: { groupId: number; studentId: number; role: "LEADER" | "MEMBER" }[] = [];
  const touched = new Set<number>();
  let created = 0;

  while (ungrouped.length > 0 && slots.length > 0) {
    // Pick the smallest slot, assign one student, requeue.
    slots.sort((a, b) => a.size - b.size || a.groupId - b.groupId);
    const slot = slots[0]!;
    const studentId = ungrouped.shift()!;
    assignments.push({ groupId: slot.groupId, studentId, role: "MEMBER" });
    slot.size++;
    touched.add(slot.groupId);
    if (slot.size >= slot.capacity) slots.shift();
  }

  // If students remain and the lecturer allows new-group creation, spin them up.
  if (ungrouped.length > 0 && parsed.data.createGroupsIfNeeded) {
    const baseLetters = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"];
    const existingNames = new Set(groups.map((g) => g.name));
    while (ungrouped.length > 0) {
      const letter =
        baseLetters.find((l) => !existingNames.has(`Kumpulan ${l} (${course.code})`)) ??
        `Auto-${Date.now()}-${created}`;
      const name = `Kumpulan ${letter} (${course.code})`;
      existingNames.add(name);
      const newGroup = await prisma.projectGroup.create({
        data: { courseId: course.id, name, maxMembers: parsed.data.defaultGroupSize },
        select: { id: true, maxMembers: true },
      });
      created++;
      touched.add(newGroup.id);
      let firstInGroup = true;
      while (ungrouped.length > 0) {
        const studentId = ungrouped.shift()!;
        assignments.push({
          groupId: newGroup.id,
          studentId,
          role: firstInGroup ? "LEADER" : "MEMBER",
        });
        firstInGroup = false;
        if (
          assignments.filter((a) => a.groupId === newGroup.id).length >= newGroup.maxMembers
        ) {
          break;
        }
      }
    }
  }

  // Persist all assignments.
  if (assignments.length > 0) {
    await prisma.$transaction(
      assignments.map((a) =>
        prisma.groupMember.upsert({
          where: { groupId_studentId: { groupId: a.groupId, studentId: a.studentId } },
          update: { role: a.role },
          create: a,
        }),
      ),
    );

    // Notify each assigned student.
    const byStudent = new Map<number, number>();
    for (const a of assignments) byStudent.set(a.studentId, a.groupId);
    await notifyMany([...byStudent.keys()], {
      title: "Anda telah dikumpulkan",
      message: `Pensyarah ${course.code} telah meletakkan anda dalam kumpulan secara automatik.`,
      link: "groups",
    });
  }

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${course.code}`);
  revalidatePath("/student/kumpulan");

  return {
    ok: true,
    data: {
      assignedCount: assignments.length,
      groupsTouched: touched.size,
      groupsCreated: created,
      ungroupedRemaining: ungrouped.length,
    },
  };
}
