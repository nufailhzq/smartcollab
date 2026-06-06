import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/common/EmptyState";
import { GraduationCap, Layers, Users2 } from "lucide-react";
import { AssignmentPanels } from "./assignment-panels";

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return <EmptyState title="Hanya admin dibenarkan." />;
  }

  const [courses, students, lecturers] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        lecturerId: true,
        lecturer: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", isActive: true },
      select: {
        id: true,
        name: true,
        matricNum: true,
        faculty: true,
        program: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "LECTURER", isActive: true },
      select: { id: true, name: true, matricNum: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const enrollmentRows = await prisma.classEnrollment.findMany({
    select: { studentId: true, courseId: true },
  });
  const enrollmentMap: Record<number, number[]> = {};
  for (const e of enrollmentRows) {
    if (!enrollmentMap[e.courseId]) enrollmentMap[e.courseId] = [];
    enrollmentMap[e.courseId]!.push(e.studentId);
  }

  return (
    <div className="space-y-5">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Layers size={24} /> Pemberian Kursus
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Daftarkan pelajar dan pensyarah ke kursus secara pukal. Gunakan
            kekotak carian untuk menapis senarai pelajar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50">
            <Layers className="text-ukm-teal" size={22} />
          </div>
          <div>
            <p className="text-3xl font-bold text-ukm-navy">{courses.length}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Kursus
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-50">
            <Users2 className="text-purple-600" size={22} />
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-700">{students.length}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Pelajar Aktif
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50">
            <GraduationCap className="text-emerald-600" size={22} />
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-700">
              {lecturers.length}
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Pensyarah
            </p>
          </div>
        </div>
      </div>

      <AssignmentPanels
        courses={courses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          lecturerId: c.lecturerId,
          lecturerName: c.lecturer?.name ?? null,
          enrollmentCount: c._count.enrollments,
        }))}
        students={students.map((s) => ({
          id: s.id,
          name: s.name,
          matricNum: s.matricNum,
          faculty: s.faculty,
          program: s.program,
        }))}
        lecturers={lecturers.map((l) => ({
          id: l.id,
          name: l.name,
          matricNum: l.matricNum,
        }))}
        enrollmentMap={enrollmentMap}
        initialCourseId={searchParams.course ? Number(searchParams.course) : null}
      />
    </div>
  );
}
