import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/queries/courses";
import {
  getKumpulanContext,
  getRequestGroupContext,
} from "@/server/queries/groups";
import { EmptyState } from "@/components/common/EmptyState";
import { GroupBrowser } from "./group-browser";
import { RequestGroupForm } from "./request-group-form";
import { Users } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Menunggu Kelulusan", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Diluluskan", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
};

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
  const reqCtx = selectedCourse
    ? await getRequestGroupContext(studentId, selectedCourse.id)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ukm-navy">Kumpulan Saya</h1>
        <p className="text-sm text-slate-500">
          Lihat dan urus kumpulan anda mengikut kursus
        </p>
      </div>

      {reqCtx?.myGroup && (
        <div className="card flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Permohonan kumpulan anda:{" "}
            <span className="font-semibold text-ukm-navy">{reqCtx.myGroup.name}</span>
          </p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              STATUS_BADGE[reqCtx.myGroup.status]?.cls ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {STATUS_BADGE[reqCtx.myGroup.status]?.label ?? reqCtx.myGroup.status}
          </span>
        </div>
      )}

      {selectedCourse &&
        reqCtx &&
        (!reqCtx.myGroup || reqCtx.myGroup.status === "REJECTED") && (
          <RequestGroupForm
            courseId={selectedCourse.id}
            classmates={reqCtx.eligibleClassmates}
          />
        )}

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
