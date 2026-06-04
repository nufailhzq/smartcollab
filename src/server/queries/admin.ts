import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";

export type AdminUserFilters = {
  role?: Role | "ALL";
  search?: string;
  isActive?: "ALL" | "ACTIVE" | "INACTIVE";
};

export async function getAdminUsers(filters: AdminUserFilters = {}) {
  const where: Prisma.UserWhereInput = {};
  if (filters.role && filters.role !== "ALL") where.role = filters.role;
  if (filters.isActive === "ACTIVE") where.isActive = true;
  else if (filters.isActive === "INACTIVE") where.isActive = false;
  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { matricNum: { contains: q } },
      ];
    }
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      matricNum: true,
      faculty: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          taughtCourses: true,
          submissions: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getAdminCourses() {
  return prisma.course.findMany({
    include: {
      lecturer: { select: { id: true, name: true, matricNum: true } },
      _count: {
        select: { enrollments: true, assignments: true, groups: true, content: true },
      },
    },
    orderBy: { code: "asc" },
  });
}

export async function getLecturerOptions() {
  return prisma.user.findMany({
    where: { role: "LECTURER", isActive: true },
    select: { id: true, name: true, matricNum: true },
    orderBy: { name: "asc" },
  });
}

export async function getSystemStats() {
  const [
    users,
    students,
    lecturers,
    admins,
    activeUsers,
    courses,
    enrollments,
    assignments,
    submissions,
    groups,
    messages,
    notifications,
    events,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "LECTURER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.course.count(),
    prisma.classEnrollment.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.projectGroup.count(),
    prisma.message.count(),
    prisma.notification.count(),
    prisma.calendarEvent.count(),
  ]);

  return {
    users,
    students,
    lecturers,
    admins,
    activeUsers,
    courses,
    enrollments,
    assignments,
    submissions,
    groups,
    messages,
    notifications,
    events,
  };
}

export type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>[number];
export type AdminCourse = Awaited<ReturnType<typeof getAdminCourses>>[number];
export type LecturerOption = Awaited<ReturnType<typeof getLecturerOptions>>[number];
export type SystemStats = Awaited<ReturnType<typeof getSystemStats>>;
