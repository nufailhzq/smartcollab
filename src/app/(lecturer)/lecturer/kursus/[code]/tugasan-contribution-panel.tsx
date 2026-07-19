"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ClipboardCheck,
  MessageSquareQuote,
  Users,
} from "lucide-react";
import { getAssignmentContributionDetail } from "@/server/actions/contribution";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

type Member = {
  userId: number;
  name: string;
  matricNum: string | null;
  groupName: string;
  contributionScore: number | null;
  riskFlag: boolean;
  selfDeclaration: string | null;
  received: { raterName: string; score: number; comment: string | null }[];
};

// Collapsible per-tugasan contribution panel on the lecturer course page. Loads
// lazily on first expand so a course with many assignments stays cheap to render.
// Shows, per student: their contribution % (peer + activity), Berisiko flag,
// their own Sumbangan Sendiri comment, and the peer ratings they received.
export function TugasanContributionPanel({ tugasanId }: { tugasanId: number }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      startTransition(async () => {
        const res = await getAssignmentContributionDetail(tugasanId);
        if (res.ok) setMembers(res.members);
        else setError(res.error);
        setLoaded(true);
      });
    }
  }

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ukm-teal hover:underline"
      >
        <MessageSquareQuote size={13} />
        Sumbangan & komen pelajar
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3">
          {isPending && !loaded ? (
            <p className="inline-flex items-center gap-2 text-xs text-slate-500">
              <LoadingSpinner /> Memuatkan…
            </p>
          ) : error ? (
            <p className="text-xs italic text-ukm-red">{error}</p>
          ) : members && members.length === 0 ? (
            <p className="text-xs italic text-slate-400">
              Tiada kumpulan atau data sumbangan untuk tugasan ini lagi.
            </p>
          ) : (
            <div className="space-y-2.5">
              {members?.map((m) => (
                <article
                  key={`${m.groupName}-${m.userId}`}
                  className={`rounded-lg border p-3 ${
                    m.riskFlag ? "border-l-4 border-ukm-red bg-red-50/30" : "border-slate-200"
                  }`}
                >
                  <header className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ukm-navy">{m.name}</span>
                    {m.matricNum && (
                      <span className="font-mono text-[10px] text-slate-400">{m.matricNum}</span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                      <Users size={9} /> {m.groupName}
                    </span>
                    {m.riskFlag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-ukm-red">
                        <AlertTriangle size={9} /> Berisiko
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-600">
                      Sumbangan:{" "}
                      <strong
                        className={`tabular-nums ${
                          m.riskFlag ? "text-ukm-red" : "text-ukm-navy"
                        }`}
                      >
                        {m.contributionScore === null ? "—" : `${m.contributionScore}%`}
                      </strong>
                    </span>
                  </header>

                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                    <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <ClipboardCheck size={10} /> Sumbangan Sendiri
                    </p>
                    {m.selfDeclaration ? (
                      <p className="whitespace-pre-wrap text-xs text-slate-700">
                        {m.selfDeclaration}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400">Belum diisi.</p>
                    )}
                  </div>

                  {m.received.length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Penilaian diterima ({m.received.length})
                      </p>
                      <ul className="space-y-1">
                        {m.received.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 rounded-md bg-white px-2 py-1 text-xs shadow-soft"
                          >
                            <span className="shrink-0 rounded bg-ukm-teal/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-ukm-teal">
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
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
