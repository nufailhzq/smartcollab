import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMonitoringData, getTaughtCourses } from "@/server/queries/lecturer";
import { getCourseContributionScores } from "@/server/actions/contribution";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/common/EmptyState";
import { BulkAlertButton } from "./bulk-alert-button";
import { GroupFilter } from "./group-filter";
import { TugasanFilter } from "./tugasan-filter";
import { MonitoringTable } from "./monitoring-table";
import { BarChart3, AlertTriangle } from "lucide-react";

export default async function LecturerMonitoringPage({
  searchParams,
}: {
  searchParams: { course?: string; group?: string; tugasan?: string };
}) {
  const session = await auth();
  const lecturerId = session!.user.id;

  const courses = await getTaughtCourses(lecturerId);
  const selectedCode = (searchParams.course ?? courses[0]?.code ?? null)?.toUpperCase() ?? null;
  const selectedCourse = selectedCode ? courses.find((c) => c.code === selectedCode) : null;

  // Optional per-tugasan scope for the contribution signal. Only GROUP
  // assignments carry peer/self-declaration data, so the filter lists those.
  const groupAssignments = selectedCourse
    ? await prisma.assignment.findMany({
        where: { courseId: selectedCourse.id, type: "GROUP" },
        select: { id: true, title: true },
        orderBy: { dueDate: "asc" },
      })
    : [];
  const parsedTugasan = Number(searchParams.tugasan);
  const selectedTugasanId =
    Number.isInteger(parsedTugasan) &&
    groupAssignments.some((a) => a.id === parsedTugasan)
      ? parsedTugasan
      : null;

  const [data, contribScores] = selectedCourse
    ? await Promise.all([
        getMonitoringData(lecturerId, selectedCourse.id),
        getCourseContributionScores(selectedCourse.id, selectedTugasanId ?? undefined),
      ])
    : [null, new Map<number, { score: number | null; riskFlag: boolean }>()];

  // Group filter: the distinct group names present in this course's rows, plus
  // an "ungrouped" bucket. `selectedGroup` narrows the table to one group so a
  // lecturer can spot inactive students within it.
  const UNGROUPED = "__none__";
  const groupNames = data
    ? Array.from(new Set(data.rows.map((r) => r.groupName).filter((g): g is string => !!g))).sort()
    : [];
  const hasUngrouped = data ? data.rows.some((r) => !r.groupName) : false;
  const selectedGroup = searchParams.group ?? null;
  const visibleRows = (
    data
      ? data.rows.filter((r) => {
          if (!selectedGroup) return true;
          if (selectedGroup === UNGROUPED) return !r.groupName;
          return r.groupName === selectedGroup;
        })
      : []
  ).map((r) => {
    const c = contribScores.get(r.studentId);
    return {
      ...r,
      contributionScore: c?.score ?? null,
      contributionRisk: c?.riskFlag ?? false,
    };
  });

  // "Pelajar Berisiko" now counts the existing academic flag OR a free-rider
  // contribution risk flag (Phase 3.4).
  const flaggedCount = visibleRows.filter((r) => r.flagged || r.contributionRisk).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ukm-navy">
          <BarChart3 size={24} className="text-ukm-teal" /> Pemantauan Kemajuan
        </h1>
        {data && (
          <BulkAlertButton
            courseId={data.course.id}
            courseCode={data.course.code}
            rows={visibleRows.map((r) => ({
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
                  title={c.title}
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
              {/* Group + tugasan filters — only when the course has groups. The
                  tugasan filter scopes the "Skor Sumbangan" signal to one group
                  assignment; "Semua" sums it across every tugasan. */}
              {(groupNames.length > 0 || hasUngrouped || groupAssignments.length > 0) && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {(groupNames.length > 0 || hasUngrouped) && (
                    <GroupFilter
                      courseCode={data.course.code}
                      groups={groupNames}
                      hasUngrouped={hasUngrouped}
                      selected={selectedGroup}
                      selectedTugasan={selectedTugasanId}
                    />
                  )}
                  {groupAssignments.length > 0 && (
                    <TugasanFilter
                      courseCode={data.course.code}
                      selectedGroup={selectedGroup}
                      tugasan={groupAssignments}
                      selected={selectedTugasanId}
                    />
                  )}
                </div>
              )}

              {/* Two summary stat cards only. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50">
                    <BarChart3 className="text-ukm-teal" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ukm-navy">{visibleRows.length}</p>
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

              {visibleRows.length === 0 ? (
                <EmptyState title="Tiada pelajar dalam pilihan ini" />
              ) : (
                <MonitoringTable
                  courseId={data.course.id}
                  rows={visibleRows.map((r) => ({
                    studentId: r.studentId,
                    studentName: r.studentName,
                    matricNum: r.matricNum,
                    groupName: r.groupName,
                    lastSeenAt: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
                    flagged: r.flagged,
                    flagReason: r.flagReason,
                    contributionScore: r.contributionScore,
                    contributionRisk: r.contributionRisk,
                  }))}
                />
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
