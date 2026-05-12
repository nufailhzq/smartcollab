import { prisma } from "@/lib/prisma";

export async function getEnrolledCourses(studentId: number) {
  return prisma.course.findMany({
    where: { enrollments: { some: { studentId } } },
    include: {
      lecturer: { select: { id: true, name: true, matricNum: true } },
      _count: { select: { assignments: true, content: true } },
    },
    orderBy: { code: "asc" },
  });
}

export async function getEnrolledCourseByCode(studentId: number, code: string) {
  const course = await prisma.course.findFirst({
    where: {
      code,
      enrollments: { some: { studentId } },
    },
    include: {
      lecturer: { select: { id: true, name: true, matricNum: true } },
      content: {
        include: { postedBy: { select: { id: true, name: true } } },
        orderBy: { postedAt: "desc" },
      },
      assignments: {
        orderBy: { dueDate: "asc" },
        include: {
          submissions: {
            where: { studentId },
            include: { feedback: { include: { lecturer: { select: { name: true } } } } },
          },
        },
      },
    },
  });
  return course;
}
