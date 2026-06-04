import { BookOpen } from "lucide-react";
import { getAdminCourses, getLecturerOptions } from "@/server/queries/admin";
import { CourseManager } from "./course-manager";

export default async function AdminCoursesPage() {
  const [courses, lecturers] = await Promise.all([getAdminCourses(), getLecturerOptions()]);

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <BookOpen size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Pengurusan Kursus</h1>
            <p className="mt-1 text-sm text-white/80">
              Cipta kursus, tetapkan pensyarah, dan urus katalog semester.
            </p>
          </div>
        </div>
      </div>

      <CourseManager
        courses={courses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          description: c.description,
          semester: c.semester,
          creditHours: c.creditHours,
          lecturer: c.lecturer
            ? { id: c.lecturer.id, name: c.lecturer.name, matricNum: c.lecturer.matricNum }
            : null,
          counts: c._count,
        }))}
        lecturers={lecturers}
      />
    </div>
  );
}
