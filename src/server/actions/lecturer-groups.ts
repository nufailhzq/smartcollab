"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser, notifyMany } from "@/lib/notifications";
import {
  assignStudentSchema,
  createGroupSchema,
  deleteGroupSchema,
  removeStudentSchema,
  updateGroupSchema,
} from "@/schemas/lecturer-group";
import { setGroupStatusSchema, reshuffleRandomSchema } from "@/schemas/group";
import { randomGroupsWithSeed } from "@/lib/random-groups";
import type { ActionResult } from "@/schemas/common";

async function ensureLecturerOwnsCourse(courseId: number, lecturerId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, lecturerId: true },
  });
  if (!course || course.lecturerId !== lecturerId) return null;
  return course;
}

export async function createGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = createGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const course = await ensureLecturerOwnsCourse(parsed.data.courseId, session.user.id);
  if (!course) return { ok: false, error: "Anda bukan pensyarah kursus ini." };

  await prisma.projectGroup.create({
    // Lecturer-created groups via the group manager are standing groups.
    data: {
      courseId: course.id,
      name: parsed.data.name,
      maxMembers: parsed.data.maxMembers,
      assignmentId: null,
    },
  });

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function updateGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = updateGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { code: true, lecturerId: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (parsed.data.maxMembers < group._count.members) {
    return {
      ok: false,
      error: `Saiz baharu (${parsed.data.maxMembers}) lebih kecil daripada bilangan ahli sedia ada (${group._count.members}).`,
    };
  }

  await prisma.projectGroup.update({
    where: { id: group.id },
    data: { name: parsed.data.name, maxMembers: parsed.data.maxMembers },
  });

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function deleteGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = deleteGroupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.projectGroup.delete({ where: { id: group.id } });
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function assignStudentToGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = assignStudentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { id: true, code: true, lecturerId: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (group._count.members >= group.maxMembers) {
    return { ok: false, error: "Kumpulan sudah penuh." };
  }

  // Student must be enrolled in the course
  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      courseId_studentId: { courseId: group.course.id, studentId: parsed.data.studentId },
    },
  });
  if (!enrollment) {
    return { ok: false, error: "Pelajar tidak berdaftar dalam kursus ini." };
  }

  // Membership invariant is per GROUPING CONTEXT, not per course: a student may
  // be in their standing group AND in a per-assignment ad-hoc group at once.
  // So only displace them from groups in the SAME context as the target
  // (same assignmentId) — never across contexts. Wrapped in a transaction so a
  // failure can't leave the student in two groups (or none).
  await prisma.$transaction([
    prisma.groupMember.deleteMany({
      where: {
        studentId: parsed.data.studentId,
        group: { courseId: group.course.id, assignmentId: group.assignmentId },
        groupId: { not: group.id },
      },
    }),
    prisma.groupMember.upsert({
      where: {
        groupId_studentId: { groupId: group.id, studentId: parsed.data.studentId },
      },
      update: { role: parsed.data.role },
      create: {
        groupId: group.id,
        studentId: parsed.data.studentId,
        role: parsed.data.role,
      },
    }),
  ]);

  await notifyUser(parsed.data.studentId, {
    title: `Ditambah ke ${group.name}`,
    message: `Pensyarah telah meletakkan anda dalam ${group.name} (${group.course.code}).`,
    link: "groups",
  });

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function removeStudentFromGroup(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = removeStudentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: { course: { select: { code: true, lecturerId: true } } },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  await prisma.groupMember.deleteMany({
    where: { groupId: group.id, studentId: parsed.data.studentId },
  });
  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath(`/student/kumpulan`);
  return { ok: true };
}

export async function setGroupStatus(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = setGroupStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const group = await prisma.projectGroup.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      course: { select: { code: true, lecturerId: true } },
      members: { select: { studentId: true } },
    },
  });
  if (!group) return { ok: false, error: "Kumpulan tidak wujud." };
  if (group.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }

  const memberIds = group.members.map((m) => m.studentId);

  // Ad-hoc (per-assignment) groups send students back to /student/tugasan/<id>;
  // standing groups use the "groups" tag. The membership invariant for ad-hoc
  // groups keys off GroupMember rows, so a REJECT must actually free the members:
  // for ad-hoc we DELETE the group (cascade drops GroupMember), truly resetting
  // everyone to "Tiada Kumpulan". Standing groups keep the REJECTED marker.
  const isAdHoc = group.assignmentId !== null;
  const link = isAdHoc ? `student/tugasan/${group.assignmentId}` : "groups";

  if (parsed.data.action === "REJECT") {
    if (isAdHoc) {
      await prisma.projectGroup.delete({ where: { id: group.id } });
    } else {
      await prisma.projectGroup.update({
        where: { id: group.id },
        data: { status: "REJECTED" },
      });
    }
    await notifyMany(memberIds, {
      title: "Permohonan Kumpulan Ditolak",
      message: `Kumpulan "${group.name}" (${group.course.code}) ditolak. Anda boleh membentuk kumpulan baharu.`,
      link,
    });
  } else {
    // Approve this group, and auto-reject any OTHER pending group in the SAME
    // grouping context that shares a member — a student can't have two competing
    // pending memberships in one context. Context = the course for standing
    // groups (assignmentId null), or the specific assignment for ad-hoc (CUSTOM)
    // groups. Finding the overlaps and rejecting them must be ATOMIC with the
    // approval, otherwise a concurrent request could slip a new overlapping
    // pending group in between the read and write.
    const overlapContext =
      group.assignmentId === null
        ? { courseId: group.courseId, assignmentId: null }
        : { assignmentId: group.assignmentId };
    const bumped = await prisma.$transaction(async (tx) => {
      const overlaps = await tx.projectGroup.findMany({
        where: {
          ...overlapContext,
          status: "PENDING",
          id: { not: group.id },
          members: { some: { studentId: { in: memberIds } } },
        },
        include: { members: { select: { studentId: true } } },
      });
      await tx.projectGroup.update({
        where: { id: group.id },
        data: { status: "APPROVED" },
      });
      await tx.projectGroup.updateMany({
        where: { id: { in: overlaps.map((g) => g.id) } },
        data: { status: "REJECTED" },
      });
      return overlaps;
    });

    await notifyMany(memberIds, {
      title: "Kumpulan Diluluskan",
      message: `Kumpulan "${group.name}" (${group.course.code}) telah diluluskan.`,
      link,
    });
    const bumpedMemberIds = Array.from(
      new Set(bumped.flatMap((g) => g.members.map((m) => m.studentId))),
    ).filter((id) => !memberIds.includes(id));
    await notifyMany(bumpedMemberIds, {
      title: "Permohonan Kumpulan Ditolak",
      message: `Permohonan kumpulan anda dalam ${group.course.code} ditolak kerana ahli bertindih. Sila bentuk kumpulan baharu.`,
      link,
    });
  }

  revalidatePath("/lecturer/pengurusan-kumpulan");
  revalidatePath(`/lecturer/kursus/${group.course.code}`);
  revalidatePath("/student/kumpulan");
  if (isAdHoc) revalidatePath(`/student/tugasan/${group.assignmentId}`);
  return { ok: true };
}

/**
 * Re-run RANDOM grouping for an assignment: clear THIS assignment's existing
 * ad-hoc groups and rebuild from the live enrolled roster, all in one
 * transaction. This is idempotent and intentional — re-running cannot leave a
 * student in two groups or in none. Standing groups (assignmentId null) are
 * filtered out of every read/write, so they are never touched.
 */
export async function reshuffleRandomGroups(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "LECTURER") return { ok: false, error: "Tidak dibenarkan." };

  const parsed = reshuffleRandomSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const assignment = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { course: { select: { id: true, code: true, lecturerId: true } } },
  });
  if (!assignment) return { ok: false, error: "Tugasan tidak wujud." };
  if (assignment.course.lecturerId !== session.user.id) {
    return { ok: false, error: "Anda bukan pensyarah kursus ini." };
  }
  if (assignment.groupingMode !== "RANDOM") {
    return { ok: false, error: "Hanya tugasan mod RAWAK boleh dikocok semula." };
  }

  const roster = (
    await prisma.classEnrollment.findMany({
      where: { courseId: assignment.course.id },
      select: { studentId: true },
    })
  ).map((r) => r.studentId);

  const { seed, groups } = randomGroupsWithSeed(
    roster,
    parsed.data.groupSize ?? 4,
    assignment.title,
  );
  console.warn(
    `RANDOM reshuffle for ${assignment.course.code} "${assignment.title}": seed=${seed}, ${roster.length} students -> ${groups.length} groups`,
  );

  await prisma.$transaction(async (tx) => {
    // Clear only THIS assignment's ad-hoc groups (cascade removes their members).
    await tx.projectGroup.deleteMany({ where: { assignmentId: assignment.id } });
    for (const g of groups) {
      await tx.projectGroup.create({
        data: {
          courseId: assignment.course.id,
          name: g.name,
          status: "APPROVED",
          createdById: session.user.id,
          assignmentId: assignment.id,
          members: {
            create: g.memberIds.map((studentId) => ({ studentId, role: "MEMBER" })),
          },
        },
      });
    }
  });

  revalidatePath(`/lecturer/kursus/${assignment.course.code}`);
  revalidatePath("/lecturer/penghantaran");
  return { ok: true };
}
