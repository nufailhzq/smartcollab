import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMonitoringData, getTaughtCourses } from "@/server/queries/lecturer";
import { EmptyState } from "@/components/common/EmptyState";
import { AlertTriangle, BarChart3, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BarChart3 size={24} /> Progress Monitoring
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Pantau aktiviti pelajar setiap kursus. Pelajar berisiko ditanda dengan ikon merah.
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
              <div className="grid gap-4 sm:grid-cols-3">
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
                    <CheckCircle2 className="text-emerald-600" size={22} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">
                      {data.rows.length - flaggedCount}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Pelajar Sihat
                    </p>
                  </div>
                </div>
              </div>

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
                        <th className="text-center">Hantar</th>
                        <th className="text-center">Lewat</th>
                        <th className="text-center">Belum</th>
                        <th className="text-center">Purata</th>
                        <th>Aktiviti Akhir</th>
                        <th>Catatan</th>
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
                          <td className="text-center font-semibold text-ukm-navy">
                            {r.submitted}
                            <span className="text-xs text-slate-400">/{r.totalAssignments}</span>
                          </td>
                          <td className="text-center">
                            {r.late > 0 ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                {r.late}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="text-center">
                            {r.missing > 0 ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-ukm-red">
                                {r.missing}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
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
                            {r.flagReason ? (
                              <span className="text-ukm-red">{r.flagReason}</span>
                            ) : (
                              <span className="text-slate-400">Sihat</span>
                            )}
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
