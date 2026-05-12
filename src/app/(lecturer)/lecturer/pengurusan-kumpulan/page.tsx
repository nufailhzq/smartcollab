import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTaughtCourses, getCourseGroups } from "@/server/queries/lecturer";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import { GroupManager } from "./group-manager";

export default async function LecturerGroupsPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const session = await auth();
  const lecturerId = session!.user.id;

  const courses = await getTaughtCourses(lecturerId);
  const selectedCode = (searchParams.course ?? courses[0]?.code ?? null)?.toUpperCase() ?? null;
  const selectedCourse = selectedCode ? courses.find((c) => c.code === selectedCode) : null;

  const data = selectedCourse ? await getCourseGroups(lecturerId, selectedCourse.id) : null;

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">Urus Kumpulan</h1>
          <p className="mt-1 text-sm text-white/80">
            Cipta kumpulan, letakkan pelajar, dan urus saiz kumpulan untuk setiap kursus.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="Tiada kursus diajar"
          description="Anda perlu mempunyai kursus untuk menguruskan kumpulan."
          Icon={Users}
        />
      ) : (
        <>
          <nav className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const active = c.code === selectedCode;
              return (
                <Link
                  key={c.code}
                  href={`/lecturer/pengurusan-kumpulan?course=${c.code}`}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-ukm-orange bg-orange-50 text-ukm-orange"
                      : "border-slate-200 bg-white text-slate-600 hover:border-ukm-teal hover:bg-sky-50"
                  }`}
                >
                  <span className="font-mono text-xs">{c.code}</span>{" "}
                  <span className="text-slate-500">— {c.title}</span>
                </Link>
              );
            })}
          </nav>

          {data ? (
            <GroupManager
              courseId={data.course.id}
              courseCode={data.course.code}
              groups={data.groups.map((g) => ({
                id: g.id,
                name: g.name,
                maxMembers: g.maxMembers,
                memberCount: g._count.members,
                members: g.members.map((m) => ({
                  id: m.id,
                  studentId: m.studentId,
                  name: m.student.name,
                  matricNum: m.student.matricNum,
                  role: m.role,
                })),
              }))}
              ungroupedStudents={data.ungroupedStudents.map((s) => ({
                id: s.id,
                name: s.name,
                matricNum: s.matricNum,
              }))}
            />
          ) : (
            <EmptyState title="Pilih kursus" description="Pilih kursus dari atas." Icon={Users} />
          )}
        </>
      )}
    </div>
  );
}
