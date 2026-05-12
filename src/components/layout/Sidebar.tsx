import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeftSidebar, type SidebarCourse } from "./LeftSidebar";

export async function Sidebar() {
  const session = await auth();
  if (!session) return null;

  const role = session.user.role;
  let courses: SidebarCourse[] = [];

  try {
    if (role === "STUDENT") {
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId: session.user.id },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
        orderBy: {
          course: {
            code: "asc",
          },
        },
      });

      courses = enrollments.map((e) => e.course);
    } else if (role === "LECTURER") {
      courses = await prisma.course.findMany({
        where: { lecturerId: session.user.id },
        select: {
          id: true,
          code: true,
          title: true,
        },
        orderBy: {
          code: "asc",
        },
      });
    }
  } catch (error) {
    console.error("Sidebar database query failed:", error);
    courses = [];
  }

  return <LeftSidebar role={role} courses={courses} />;
}