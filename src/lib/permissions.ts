import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export async function canManageCourse(
  userId: number,
  courseId: number,
  role: Role,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role !== "LECTURER") return false;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { lecturerId: true },
  });
  return course?.lecturerId === userId;
}

export async function canManageGroup(
  userId: number,
  groupId: number,
  role: Role,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role !== "LECTURER") return false;
  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    select: { course: { select: { lecturerId: true } } },
  });
  return group?.course.lecturerId === userId;
}

export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "LECTURER":
      return "/lecturer";
    case "ADMIN":
      return "/admin";
  }
}
