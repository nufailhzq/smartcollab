import { auth } from "@/lib/auth";
import { getCalendarForStudent } from "@/server/queries/calendar";
import { getEnrolledCourses } from "@/server/queries/courses";
import { CalendarView } from "./calendar-view";

export default async function StudentCalendarPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const session = await auth();
  const studentId = session!.user.id;

  const now = new Date();
  const year = Number(searchParams.y) || now.getFullYear();
  const month = Number(searchParams.m);
  const monthIndex =
    Number.isInteger(month) && month >= 0 && month <= 11 ? month : now.getMonth();

  const [{ events, assignments }, courses] = await Promise.all([
    getCalendarForStudent(studentId),
    getEnrolledCourses(studentId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kalendar</h1>
        <p className="text-sm text-slate-500">
          Pengurusan acara peribadi serta tarikh akhir tugasan kursus anda.
        </p>
      </div>
      <CalendarView
        year={year}
        monthIndex={monthIndex}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date.toISOString(),
          time: e.time,
          courseCode: e.course?.code ?? null,
          groupName: e.group?.name ?? null,
          createdById: e.createdById,
          createdByName: e.createdBy.name,
          isMine: e.createdById === studentId,
          reminder: e.reminder,
        }))}
        assignments={assignments
          .filter((a) => a.dueDate)
          .map((a) => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate!.toISOString(),
            courseCode: a.course.code,
          }))}
        courses={courses.map((c) => ({ id: c.id, code: c.code, title: c.title }))}
      />
    </div>
  );
}
