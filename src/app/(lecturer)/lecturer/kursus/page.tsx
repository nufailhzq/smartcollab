import { auth } from "@/lib/auth";
import { getTaughtCourses } from "@/server/queries/lecturer";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/common/EmptyState";

export default async function LecturerCoursesPage() {
  const session = await auth();
  const courses = await getTaughtCourses(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ukm-navy">Kursus Saya</h1>
        <p className="text-sm text-slate-500">
          Kursus yang anda ajar untuk semester ini. Klik untuk urus kandungan, tugasan dan kumpulan.
        </p>
      </div>
      {courses.length === 0 ? (
        <EmptyState
          title="Tiada kursus diajar"
          description="Hubungi pentadbir untuk pengagihan kursus."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              code={c.code}
              title={c.title}
              lecturerName={c.lecturer?.name ?? null}
              lecturerAvatarPath={c.lecturer?.avatarPath ?? null}
              semester={c.semester}
              creditHours={c.creditHours}
              href={`/lecturer/kursus/${c.code}`}
              ctaLabel="Urus"
            />
          ))}
        </div>
      )}
    </div>
  );
}
