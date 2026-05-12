import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/queries/courses";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/common/EmptyState";

export default async function StudentCoursesPage() {
  const session = await auth();
  const courses = await getEnrolledCourses(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kursus Saya</h1>
        <p className="text-sm text-slate-500">Senarai kursus yang anda berdaftar untuk semester ini.</p>
      </div>
      {courses.length === 0 ? (
        <EmptyState
          title="Tiada kursus didaftar"
          description="Hubungi pentadbir untuk pendaftaran kursus."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              code={c.code}
              title={c.title}
              lecturerName={c.lecturer?.name ?? null}
              semester={c.semester}
              creditHours={c.creditHours}
              href={`/student/kursus/${c.code}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
