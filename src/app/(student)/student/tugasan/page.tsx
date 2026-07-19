import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/queries/courses";
import { getStudentAssignments } from "@/server/queries/submissions";
import { dispatchPeerAssessmentReminders } from "@/server/actions/contribution";
import { EmptyState } from "@/components/common/EmptyState";
import { ClipboardList } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { CourseFilterDropdown } from "./course-filter";

type FilterType = "all" | "INDIVIDUAL" | "GROUP";

export default async function StudentSubmissionsPage({
  searchParams,
}: {
  searchParams: { course?: string; type?: string };
}) {
  const session = await auth();
  const studentId = session!.user.id;

  // On-access, ~24h-throttled reminder: nudge students who owe a peer
  // assessment / self-declaration for a submitted group tugasan. Fire-and-forget.
  void dispatchPeerAssessmentReminders(studentId);

  const courses = await getEnrolledCourses(studentId);
  const selectedCode = searchParams.course?.toUpperCase() ?? "ALL";
  const filterType: FilterType = ["INDIVIDUAL", "GROUP"].includes(searchParams.type ?? "")
    ? (searchParams.type as FilterType)
    : "all";

  const selectedCourse =
    selectedCode !== "ALL" ? courses.find((c) => c.code === selectedCode) : null;
  const assignments = await getStudentAssignments(
    studentId,
    selectedCourse ? selectedCourse.id : undefined,
  );
  const filtered = filterType === "all" ? assignments : assignments.filter((a) => a.type === filterType);

  // Split + group: individual first, then group. Each pair is grouped by course
  // so within a section you see assignments course by course in submission order.
  function groupByCourse(list: typeof filtered): [string, typeof filtered][] {
    const map = new Map<string, typeof filtered>();
    for (const a of list) {
      const key = a.course.code;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return [...map.entries()];
  }
  const individualByCourse = groupByCourse(filtered.filter((a) => a.type === "INDIVIDUAL"));
  const groupByCourse2 = groupByCourse(filtered.filter((a) => a.type === "GROUP"));
  // Most recent first within each course.
  for (const [, list] of [...individualByCourse, ...groupByCourse2]) {
    list.sort((a, b) => {
      const at = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bt = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return bt - at;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tugasan</h1>
        <p className="text-sm text-slate-500">Senarai dan status penghantaran tugasan anda.</p>
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div className="flex-1">
          <label
            htmlFor="course-filter"
            className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
          >
            Pilih Kursus
          </label>
          <CourseFilterDropdown
            courses={courses.map((c) => ({
              code: c.code,
              title: c.title,
              lecturer: c.lecturer ? { name: c.lecturer.name } : null,
            }))}
            selectedCode={selectedCode}
            filterType={filterType}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "INDIVIDUAL", "GROUP"] as const).map((t) => {
            const next = new URLSearchParams();
            if (selectedCode !== "ALL") next.set("course", selectedCode);
            if (t !== "all") next.set("type", t);
            const href = `/student/tugasan${next.toString() ? `?${next.toString()}` : ""}`;
            return (
              <Link
                key={t}
                href={href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  filterType === t
                    ? "bg-ukm-orange text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t === "all" ? "Semua" : t === "INDIVIDUAL" ? "Individu" : "Kumpulan"}
              </Link>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tiada tugasan" Icon={ClipboardList} />
      ) : (
        <div className="space-y-8">
          {([
            {
              key: "INDIVIDUAL" as const,
              label: "Tugasan Individu",
              tint: "from-ukm-teal/15 to-sky-50/40",
              accent: "border-l-ukm-teal",
              data: individualByCourse,
            },
            {
              key: "GROUP" as const,
              label: "Tugasan Kumpulan",
              tint: "from-purple-100/60 to-fuchsia-50/40",
              accent: "border-l-purple-500",
              data: groupByCourse2,
            },
          ]
            .filter((s) => filterType === "all" || filterType === s.key)
            .filter((s) => s.data.length > 0)
          ).map((section) => (
            <div
              key={section.key}
              className={`rounded-2xl border-l-4 ${section.accent} bg-gradient-to-r ${section.tint} p-4`}
            >
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ukm-navy">
                {section.label}
                <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {section.data.reduce((sum, [, l]) => sum + l.length, 0)}
                </span>
              </h2>
              <div className="space-y-6">
                {section.data.map(([code, list]) => (
                  <section key={`${section.key}-${code}`} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      <span className="font-mono text-ukm-orange">{code}</span> ·{" "}
                      {list[0]!.course.title}
                    </h3>
                    <div className="space-y-2">
                      {list.map((a) => {
                  const sub = a.submissions[0];
                  const due = a.dueDate ? new Date(a.dueDate) : null;
                  const isPast = due ? due < new Date() : false;
                  return (
                    <article
                      key={a.id}
                      className="card flex flex-wrap items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{a.title}</h3>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                              a.type === "GROUP"
                                ? "bg-ukm-cyan/15 text-ukm-teal"
                                : "bg-ukm-teal/15 text-ukm-teal"
                            }`}
                          >
                            {a.type === "GROUP" ? "Kumpulan" : "Individu"}
                          </span>
                        </div>
                        {due && (
                          <p className="text-xs text-slate-500">
                            Tarikh akhir:{" "}
                            <span className={isPast && !sub ? "text-red-300" : ""}>
                              {formatDateTime(due)}
                            </span>
                          </p>
                        )}
                        {sub?.feedback[0] && (
                          <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            <span className="text-ukm-teal">
                              {sub.feedback[0].lecturer.name}:
                            </span>{" "}
                            {sub.feedback[0].comment}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {sub ? (
                          <span
                            className={`rounded-md px-2 py-1 text-xs ${
                              sub.status === "GRADED"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : sub.status === "LATE"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-ukm-cyan/15 text-ukm-teal"
                            }`}
                          >
                            {sub.status === "GRADED"
                              ? `Markah: ${sub.grade ?? "—"}`
                              : sub.status === "LATE"
                                ? "Lewat"
                                : "Dihantar"}
                          </span>
                        ) : isPast ? (
                          <span className="rounded-md bg-red-500/15 px-2 py-1 text-xs text-red-300">
                            Terlepas tarikh
                          </span>
                        ) : null}
                        <Link
                          href={`/student/tugasan/${a.id}`}
                          className={sub ? "btn-secondary text-sm" : "btn-primary text-sm"}
                        >
                          {sub ? "Lihat" : "Hantar"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
