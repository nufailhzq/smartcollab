import { auth } from "@/lib/auth";
import { getCalendarForLecturer } from "@/server/queries/calendar";
import { getTaughtCourses } from "@/server/queries/lecturer";
import { CalendarView } from "@/app/(student)/student/kalendar/calendar-view";

export default async function LecturerCalendarPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const session = await auth();
  const lecturerId = session!.user.id;

  const now = new Date();
  const year = Number(searchParams.y) || now.getFullYear();
  const month = Number(searchParams.m);
  const monthIndex =
    Number.isInteger(month) && month >= 0 && month <= 11 ? month : now.getMonth();

  const [{ events, assignments }, courses] = await Promise.all([
    getCalendarForLecturer(lecturerId),
    getTaughtCourses(lecturerId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ukm-navy">Kalendar</h1>
        <p className="text-sm text-slate-500">
          Acara peribadi dan tarikh akhir tugasan kursus yang anda ajar.
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
          isMine: e.createdById === lecturerId,
          reminder: e.reminder,
          notifyBeforeMinutes: e.notifyBeforeMinutes,
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
        timetable={[]}
      />
    </div>
  );
}
