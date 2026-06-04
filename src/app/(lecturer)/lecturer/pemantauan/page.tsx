import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMonitoringData, getTaughtCourses } from "@/server/queries/lecturer";
import { getMonitoringNotesMap } from "@/server/queries/monitoring-notes";
import { EmptyState } from "@/components/common/EmptyState";
import { ActivityOverview } from "./activity-overview";
import { EditableNoteCell } from "./editable-note-cell";
import { FastAlertButton } from "./fast-alert-button";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  PieChart,
  Timer,
  TrendingUp,
} from "lucide-react";
import { formatDate, relativeTime } from "@/lib/utils";

// Grade buckets used by the distribution bar chart. Each bucket gets a color
// that matches the existing severity palette in the table.
const GRADE_BUCKETS: ReadonlyArray<{
  label: string;
  min: number;
  max: number;
  color: string;
}> = [
  { label: "<40", min: 0, max: 39, color: "#dc2626" },
  { label: "40–49", min: 40, max: 49, color: "#ef4444" },
  { label: "50–59", min: 50, max: 59, color: "#f59e0b" },
  { label: "60–69", min: 60, max: 69, color: "#f59e0b" },
  { label: "70–79", min: 70, max: 79, color: "#0ea5e9" },
  { label: "80–89", min: 80, max: 89, color: "#10b981" },
  { label: "90–100", min: 90, max: 100, color: "#059669" },
];

function TimingBar({
  early,
  onTime,
  late,
  missing,
}: {
  early: number;
  onTime: number;
  late: number;
  missing: number;
}) {
  const total = early + onTime + late + missing;
  if (total === 0) {
    return <span className="text-[11px] italic text-slate-400">tiada</span>;
  }
  const pct = (n: number) => (n / total) * 100;
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
      title={`Awal ${early} · Pada masa ${onTime} · Lewat ${late} · Terlepas ${missing}`}
    >
      {early > 0 && <div className="bg-emerald-500" style={{ width: `${pct(early)}%` }} />}
      {onTime > 0 && <div className="bg-sky-400" style={{ width: `${pct(onTime)}%` }} />}
      {late > 0 && <div className="bg-amber-400" style={{ width: `${pct(late)}%` }} />}
      {missing > 0 && <div className="bg-red-400" style={{ width: `${pct(missing)}%` }} />}
    </div>
  );
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
  const notesMap = selectedCourse
    ? await getMonitoringNotesMap(lecturerId, selectedCourse.id)
    : new Map<number, string>();

  const flaggedCount = data?.rows.filter((r) => r.flagged).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BarChart3 size={24} /> Progress Monitoring
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Signal sebenar daripada data penghantaran — bukan data tiruan. Pelajar berisiko ditanda
            di bahagian atas.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState title="Tiada kursus diajar" />
      ) : (
        <>
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
                  <span className="font-mono text-xs">{c.code}</span>{" "}
                  <span className="text-slate-500">— {c.title}</span>
                </Link>
              );
            })}
          </nav>

          {data && (
            <>
              <ActivityOverview
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

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50">
                    <BarChart3 className="text-ukm-teal" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ukm-navy">{data.rows.length}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">Pelajar</p>
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
                <div className="card flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50">
                    <TrendingUp className="text-emerald-600" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">
                      {data.summary.cohortAverageGrade ?? "—"}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Purata Kohort
                    </p>
                  </div>
                </div>
                <div className="card flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50">
                    <Timer className="text-violet-600" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-violet-600">
                      {data.summary.medianFeedbackTurnaroundHours !== null
                        ? `${data.summary.medianFeedbackTurnaroundHours}j`
                        : "—"}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Median Maklum Balas
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts panel — donut (timing) + bar chart (grade distribution) */}
              {(() => {
                const t = data.summary.timingTotals;
                const totalSlots = t.early + t.onTime + t.late + t.missing;
                const timingSegments = [
                  { label: "Awal (≥24j)", value: t.early, color: "#10b981" },
                  { label: "Pada masa", value: t.onTime, color: "#38bdf8" },
                  { label: "Lewat", value: t.late, color: "#f59e0b" },
                  { label: "Terlepas", value: t.missing, color: "#f87171" },
                ];

                // Bucket each student's average grade into the histogram.
                const gradeData = GRADE_BUCKETS.map((b) => ({
                  label: b.label,
                  color: b.color,
                  value: data.rows.filter(
                    (r) =>
                      r.averageGrade !== null &&
                      r.averageGrade >= b.min &&
                      r.averageGrade <= b.max,
                  ).length,
                }));
                const gradedStudents = gradeData.reduce((s, d) => s + d.value, 0);

                return (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="card-elevated">
                      <header className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-ukm-navy">
                          <PieChart size={16} className="text-ukm-teal" /> Taburan Masa
                          Penghantaran
                        </h2>
                        <span className="text-[11px] text-slate-500">
                          {totalSlots} slot
                        </span>
                      </header>
                      <div className="flex flex-col items-center gap-4 sm:flex-row">
                        <DonutChart
                          segments={timingSegments}
                          centerValue={totalSlots}
                          centerLabel="Penghantaran"
                          size={170}
                        />
                        <ul className="grid w-full gap-1.5 text-xs">
                          {timingSegments.map((s) => {
                            const pct = totalSlots
                              ? Math.round((s.value / totalSlots) * 100)
                              : 0;
                            return (
                              <li
                                key={s.label}
                                className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50/60 px-2 py-1.5"
                              >
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                  style={{ backgroundColor: s.color }}
                                />
                                <span className="flex-1 text-slate-700">{s.label}</span>
                                <span className="font-semibold tabular-nums text-ukm-navy">
                                  {s.value}
                                </span>
                                <span className="w-9 text-right tabular-nums text-slate-400">
                                  {pct}%
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      {data.summary.feedbackTurnaroundSampleSize > 0 && (
                        <p className="mt-3 text-[11px] text-slate-500">
                          <Clock size={11} className="mb-0.5 mr-1 inline text-slate-400" />
                          Median maklum balas dikira daripada{" "}
                          {data.summary.feedbackTurnaroundSampleSize} rekod.
                        </p>
                      )}
                    </section>

                    <section className="card-elevated">
                      <header className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-ukm-navy">
                          <BarChart3 size={16} className="text-ukm-orange" /> Taburan Markah
                          Pelajar
                        </h2>
                        <span className="text-[11px] text-slate-500">
                          {gradedStudents} pelajar dimarkah
                        </span>
                      </header>
                      <BarChart data={gradeData} height={170} />
                      <p className="mt-2 text-[11px] text-slate-500">
                        Setiap bar = bilangan pelajar dengan purata markah dalam julat
                        tersebut. Pelajar tanpa markah tidak dikira.
                      </p>
                    </section>
                  </div>
                );
              })()}

              {data.rows.length === 0 ? (
                <EmptyState title="Tiada pelajar berdaftar" />
              ) : (
                <div className="card overflow-x-auto p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Pelajar</th>
                        <th>Kumpulan</th>
                        <th className="min-w-[140px]">Taburan Masa</th>
                        <th className="text-center">Purata</th>
                        <th>Aktiviti Akhir</th>
                        <th>Online Terakhir</th>
                        <th className="min-w-[200px]">Catatan</th>
                        <th className="text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr
                          key={r.studentId}
                          className={r.flagged ? "bg-red-50/40" : undefined}
                        >
                          <td>
                            {r.flagged ? (
                              <AlertTriangle
                                className="text-ukm-red"
                                size={16}
                                aria-label="Berisiko"
                              />
                            ) : (
                              <CheckCircle2
                                className="text-emerald-500"
                                size={16}
                                aria-label="Sihat"
                              />
                            )}
                          </td>
                          <td>
                            <p className="font-semibold text-ukm-navy">{r.studentName}</p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {r.matricNum ?? "—"}
                            </p>
                          </td>
                          <td>
                            {r.groupName ? (
                              <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                                {r.groupName}
                              </span>
                            ) : (
                              <span className="text-[11px] italic text-slate-400">—</span>
                            )}
                          </td>
                          <td>
                            <TimingBar
                              early={r.earlyCount}
                              onTime={r.onTimeCount}
                              late={r.late}
                              missing={r.missing}
                            />
                            <p className="mt-1 text-[10px] text-slate-500">
                              {r.earlyCount}·{r.onTimeCount}·{r.late}·{r.missing}
                            </p>
                          </td>
                          <td className="text-center">
                            {r.averageGrade !== null ? (
                              <span
                                className={
                                  r.averageGrade >= 70
                                    ? "font-bold text-emerald-600"
                                    : r.averageGrade >= 50
                                      ? "font-bold text-amber-600"
                                      : "font-bold text-ukm-red"
                                }
                              >
                                {r.averageGrade}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="text-xs text-slate-500">
                            {r.lastSubmissionAt ? formatDate(r.lastSubmissionAt) : "—"}
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
                              <span className="text-slate-400 italic">belum dilihat</span>
                            )}
                          </td>
                          <td>
                            <EditableNoteCell
                              courseId={data.course.id}
                              studentId={r.studentId}
                              initialNote={notesMap.get(r.studentId) ?? ""}
                            />
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
                      ))}
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

