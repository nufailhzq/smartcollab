import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/queries/courses";
import { getKumpulanContext } from "@/server/queries/groups";
import { EmptyState } from "@/components/common/EmptyState";
import { GroupBrowser } from "./group-browser";
import { Users } from "lucide-react";

export default async function StudentGroupsPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const session = await auth();
  const studentId = session!.user.id;

  const courses = await getEnrolledCourses(studentId);
  const selectedCode = searchParams.course?.toUpperCase() ?? courses[0]?.code ?? null;
  const selectedCourse = selectedCode ? courses.find((c) => c.code === selectedCode) : null;

  const ctx = selectedCourse
    ? await getKumpulanContext(studentId, selectedCourse.id)
    : null;

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">Kumpulan Saya</h1>
          <p className="mt-1 text-sm text-white/80">
            Lihat dan urus kumpulan anda mengikut kursus
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="Tiada kursus"
          description="Anda perlu berdaftar dalam kursus terlebih dahulu."
          Icon={Users}
        />
      ) : (
        <GroupBrowser
          studentId={studentId}
          courses={courses.map((c) => ({ id: c.id, code: c.code, title: c.title }))}
          selectedCode={selectedCode}
          groupsLocked={ctx?.course.groupsLocked ?? false}
          currentGroup={
            ctx?.currentGroup
              ? {
                  ...ctx.currentGroup,
                  members: ctx.currentGroup.members.map((m) => ({
                    ...m,
                    lastActivityAt: m.lastActivityAt
                      ? m.lastActivityAt.toISOString()
                      : null,
                  })),
                }
              : null
          }
          otherGroups={ctx?.otherGroups ?? []}
          pendingRequests={ctx?.pendingRequests ?? []}
        />
      )}
    </div>
  );
}
