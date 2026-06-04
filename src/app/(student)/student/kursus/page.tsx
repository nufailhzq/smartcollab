import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/queries/courses";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/common/EmptyState";

export default async function StudentCoursesPage() {
  const session = await auth();
  const courses = await getEnrolledCourses(session!.user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-ukm-teal/15 to-ukm-orange/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ukm-teal">
            <Sparkles size={12} className="text-amber-500" /> Semester ini
          </span>
          <h1 className="mt-2 text-3xl font-bold text-ukm-navy sm:text-4xl">
            Kursus Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Senarai kursus yang anda berdaftar. Klik mana-mana kursus untuk meneroka.
          </p>
        </div>
        {courses.length > 0 && (
          <div className="hidden shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ukm-navy shadow-soft sm:inline-flex">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-ukm-teal to-ukm-orange text-xs font-bold text-white">
              {courses.length}
            </span>
            kursus aktif
          </div>
        )}
      </div>
      {courses.length === 0 ? (
        <EmptyState
          title="Tiada kursus didaftar"
          description="Hubungi pentadbir untuk pendaftaran kursus."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              code={c.code}
              title={c.title}
              lecturerId={c.lecturer?.id ?? null}
              lecturerName={c.lecturer?.name ?? null}
              lecturerMatric={c.lecturer?.matricNum ?? null}
              lecturerAvatarPath={c.lecturer?.avatarPath ?? null}
              lecturerEmail={c.lecturer?.email ?? null}
              lecturerPhone={c.lecturer?.phone ?? null}
              semester={c.semester}
              creditHours={c.creditHours}
              href={`/student/kursus/${c.code}`}
              variant="showcase"
            />
          ))}
        </div>
      )}
    </div>
  );
}
