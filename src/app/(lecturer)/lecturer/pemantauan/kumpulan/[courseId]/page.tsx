import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Users, MessageSquareQuote, Activity, ClipboardCheck } from "lucide-react";
import { getGroupContributionDetail } from "@/server/actions/contribution";
import { EmptyState } from "@/components/common/EmptyState";

// Lecturer drill-down into one group's contribution breakdown. Reached from the
// Progress Monitoring (Pemantauan Kemajuan) table by clicking a group name.
export default async function GroupContributionPage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { group?: string };
}) {
  const courseId = Number(params.courseId);
  const groupName = searchParams.group ?? "";
  if (!Number.isInteger(courseId) || courseId <= 0 || !groupName) notFound();

  const detail = await getGroupContributionDetail(courseId, groupName);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/lecturer/pemantauan"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ukm-navy"
      >
        <ArrowLeft size={16} /> Kembali ke Pemantauan Kemajuan
      </Link>

      {!detail.ok ? (
        <EmptyState title="Tidak dapat memaparkan kumpulan" description={detail.error} />
      ) : (
        <>
          <header className="flex items-center gap-2">
            <Users size={22} className="text-ukm-teal" />
            <h1 className="text-2xl font-bold text-ukm-navy">
              Sumbangan — {detail.groupName}
            </h1>
          </header>

          {detail.members.length === 0 ? (
            <EmptyState title="Tiada ahli dalam kumpulan ini" />
          ) : (
            <div className="space-y-4">
              {detail.members.map((m) => (
                <article
                  key={m.userId}
                  className={
                    m.riskFlag
                      ? "card space-y-3 border-l-4 border-ukm-red"
                      : "card space-y-3"
                  }
                >
                  <header className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ukm-navy">{m.name}</h2>
                    {m.matricNum && (
                      <span className="font-mono text-[11px] text-slate-400">{m.matricNum}</span>
                    )}
                    {m.riskFlag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-ukm-red">
                        <AlertTriangle size={11} /> Berisiko
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <MessageSquareQuote size={14} className="text-ukm-teal" />
                        Skor Rakan:{" "}
                        <strong className="tabular-nums text-ukm-navy">
                          {m.peerScore ?? "—"}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Activity size={14} className="text-ukm-teal" />
                        Aktiviti:{" "}
                        <strong className="tabular-nums text-ukm-navy">{m.activityCount}</strong>
                      </span>
                    </div>
                  </header>

                  {/* Self declaration */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <ClipboardCheck size={12} /> Sumbangan Sendiri
                    </p>
                    {m.selfDeclaration ? (
                      <p className="whitespace-pre-wrap text-sm text-slate-700">
                        {m.selfDeclaration}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-400">Belum diisi.</p>
                    )}
                  </div>

                  {/* Peer scores received (lecturer-only) */}
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Penilaian Diterima ({m.received.length})
                    </p>
                    {m.received.length === 0 ? (
                      <p className="text-sm italic text-slate-400">
                        Belum dinilai oleh rakan sekumpulan.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {m.received.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm shadow-soft"
                          >
                            <span className="shrink-0 rounded bg-ukm-teal/10 px-1.5 py-0.5 text-xs font-bold tabular-nums text-ukm-teal">
                              {r.score}
                            </span>
                            <span className="min-w-0">
                              <span className="text-slate-500">{r.raterName}</span>
                              {r.comment && (
                                <span className="block text-slate-700">“{r.comment}”</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
