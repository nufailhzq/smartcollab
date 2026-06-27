import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMonitoringData, getTaughtCourses } from "@/server/queries/lecturer";
import { EmptyState } from "@/components/common/EmptyState";
import { BulkAlertButton } from "./bulk-alert-button";
import { FastAlertButton } from "./fast-alert-button";
import { BarChart3, AlertTriangle } from "lucide-react";
import { relativeTime } from "@/lib/utils";

// Single timing status per student, derived from their submission-timing counts.
// Worst-case priority so the badge surfaces the most urgent signal.
type TimingStatus = "AWAL" | "TEPAT" | "LEWAT" | "TERLEPAS";

const STATUS_META: Record<TimingStatus, { label: string; cls: string }> = {
  AWAL: { label: "Awal", cls: "bg-emerald-100 text-emerald-700" },
  TEPAT: { label: "Tepat Masa", cls: "bg-sky-100 text-sky-700" },
  LEWAT: { label: "Lewat", cls: "bg-amber-100 text-amber-700" },
  TERLEPAS: { label: "Terlepas", cls: "bg-red-100 text-red-700" },
};

function rowStatus(r: {
  earlyCount: number;
  onTimeCount: number;
  late: number;
  missing: number;
}): TimingStatus {
  if (r.missing > 0) return "TERLEPAS";
  if (r.late > 0) return "LEWAT";
  if (r.onTimeCount > 0) return "TEPAT";
  if (r.earlyCount > 0) return "AWAL";
  // No submissions at all and nothing missing (e.g. no assignments yet).
  return "TEPAT";
}

export default async function LecturerMonitoringPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const session = await auth();
  const lecturerId = session!.user.id;

  const courses = await getTaughtCourses(lecturerId);
  const selectedCode = (searchParams.course ?? courses[0]?.code ?? null)?.toUpperCase() ?? null;
  const selectedCourse = selectedCode ? courses.find((c) => c.code === selectedCode) : null;

  const data = selectedCourse ? await getMonitoringData(lecturerId, selectedCourse.id) : null;
  const flaggedCount = data?.rows.filter((r) => r.flagged).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ukm-navy">
          <BarChart3 size={24} className="text-ukm-teal" /> Progress Monitoring
        </h1>
        {data && (
          <BulkAlertButton
            courseId={data.course.id}
            courseCode={data.course.code}
            rows={data.rows.map((r) => ({
              studentId: r.studentId,
              studentName: r.studentName,
              matricNum: r.matricNum,
              submitted: r.submitted,
              totalAssignments: r.totalAssignments,
            }))}
          />
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState title="Tiada kursus diajar" />
      ) : (
        <>
          {/* Course tab selector */}
          <nav className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const active = c.code === selectedCode;
              return (
                <Link
                  key={c.code}
                  href={`/lecturer/pemantauan?course=${c.code}`}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-ukm-orange bg-orange-50 text-ukm-orange"
                      : "border-slate-200 bg-white text-slate-600 hover:border-ukm-teal hover:bg-sky-50"
                  }`}
                >
                  <span className="font-mono text-xs">{c.code}</span>
                </Link>
              );
            })}
          </nav>

          {data && (
            <>
              {/* Two summary stat cards only. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50">
                    <BarChart3 className="text-ukm-teal" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ukm-navy">{data.rows.length}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Jumlah Pelajar
                    </p>
                  </div>
                </div>
                <div className="card flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50">
                    <AlertTriangle className="text-ukm-red" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ukm-red">{flaggedCount}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Pelajar Berisiko
                    </p>
                  </div>
                </div>
              </div>

              {/* Single horizontal stacked timing bar with inline labels. */}
              <TimingSummaryBar totals={data.summary.timingTotals} />

              {data.rows.length === 0 ? (
                <EmptyState title="Tiada pelajar berdaftar" />
              ) : (
                <div className="card overflow-x-auto p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pelajar</th>
                        <th>Status</th>
                        <th>Online Terakhir</th>
                        <th className="text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => {
                        const status = STATUS_META[rowStatus(r)];
                        return (
                          <tr
                            key={r.studentId}
                            // At-risk rows get a subtle red left accent — no per-row icons.
                            className={
                              r.flagged
                                ? "border-l-4 border-ukm-red bg-red-50/30"
                                : "border-l-4 border-transparent"
                            }
                          >
                            <td>
                              <p className="font-semibold text-ukm-navy">{r.studentName}</p>
                              <p className="font-mono text-[11px] text-slate-500">
                                {r.matricNum ?? "—"}
                              </p>
                            </td>
                            <td>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="text-xs">
                              {r.lastSeenAt ? (
                                <span
                                  className={
                                    Date.now() - r.lastSeenAt.getTime() < 10 * 60 * 1000
                                      ? "inline-flex items-center gap-1 font-semibold text-emerald-600"
                                      : Date.now() - r.lastSeenAt.getTime() < 24 * 60 * 60 * 1000
                                        ? "text-slate-600"
                                        : "text-slate-400"
                                  }
                                  title={r.lastSeenAt.toLocaleString("ms-MY")}
                                >
                                  {Date.now() - r.lastSeenAt.getTime() < 10 * 60 * 1000 && (
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  )}
                                  {relativeTime(r.lastSeenAt)}
                                </span>
                              ) : (
                                <span className="italic text-slate-400">belum dilihat</span>
                              )}
                            </td>
                            <td className="text-center">
                              <FastAlertButton
                                courseId={data.course.id}
                                studentId={r.studentId}
                                studentName={r.studentName}
                                flagReason={r.flagReason}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TimingSummaryBar({
  totals,
}: {
  totals: { early: number; onTime: number; late: number; missing: number };
}) {
  const total = totals.early + totals.onTime + totals.late + totals.missing;
  const segments = [
    { label: "Awal", value: totals.early, color: "bg-emerald-500", dot: "bg-emerald-500" },
    { label: "Tepat Masa", value: totals.onTime, color: "bg-sky-400", dot: "bg-sky-400" },
    { label: "Lewat", value: totals.late, color: "bg-amber-400", dot: "bg-amber-400" },
    { label: "Terlepas", value: totals.missing, color: "bg-red-400", dot: "bg-red-400" },
  ];
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <section className="card space-y-3">
      <h2 className="text-sm font-semibold text-ukm-navy">Taburan Masa Penghantaran</h2>
      {total === 0 ? (
        <p className="text-[11px] italic text-slate-400">Tiada data penghantaran lagi.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {segments.map(
              (s) =>
                s.value > 0 && (
                  <div
                    key={s.label}
                    className={s.color}
                    style={{ width: `${(s.value / total) * 100}%` }}
                    title={`${s.label}: ${s.value} (${pct(s.value)}%)`}
                  />
                ),
            )}
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-600">
            {segments.map((s) => (
              <li key={s.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.label}: <span className="font-semibold tabular-nums">{s.value}</span>
                <span className="text-slate-400">({pct(s.value)}%)</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
