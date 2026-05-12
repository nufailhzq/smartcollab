import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/queries/courses";
import { getStudentAssignments } from "@/server/queries/submissions";
import { EmptyState } from "@/components/common/EmptyState";
import { ClipboardList } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type FilterType = "all" | "INDIVIDUAL" | "GROUP";

export default async function StudentSubmissionsPage({
  searchParams,
}: {
  searchParams: { course?: string; type?: string };
}) {
  const session = await auth();
  const studentId = session!.user.id;

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

  // Group by course
  const grouped = new Map<string, typeof filtered>();
  for (const a of filtered) {
    const key = a.course.code;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
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
          <form>
            <select
              id="course-filter"
              name="course"
              defaultValue={selectedCode}
              className="input-base"
            >
              <option value="ALL">Semua kursus</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.title}
                  {c.lecturer ? ` (${c.lecturer.name})` : ""}
                </option>
              ))}
            </select>
            {filterType !== "all" && <input type="hidden" name="type" value={filterType} />}
            <noscript>
              <button type="submit" className="btn-secondary mt-2 text-xs">
                Tapis
              </button>
            </noscript>
          </form>
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
        <div className="space-y-6">
          {[...grouped.entries()].map(([code, list]) => (
            <section key={code} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                <span className="font-mono text-ukm-orange">{code}</span> ·{" "}
                {list[0]!.course.title}
              </h2>
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
      )}
    </div>
  );
}
