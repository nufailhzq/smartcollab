"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, ClipboardCheck, Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  submitPeerAssessment,
  submitSelfDeclaration,
} from "@/server/actions/contribution";

// ─────────────────────────────────────────────────────────────────────────────
// Student contribution panel (free-rider detection). Shown on a GROUP
// assignment the student belongs to: rate each teammate 0–100 (+ optional
// comment) and describe your own contribution. A reminder banner shows until
// the peer assessment has been submitted.
// ─────────────────────────────────────────────────────────────────────────────

type Teammate = { id: number; name: string; matricNum: string | null };

type Props = {
  tugasanId: number;
  teammates: Teammate[]; // excludes the viewer
  initialRatings: { rateeId: number; score: number; comment: string | null }[];
  initialSelfDescription: string | null;
  /** True when the group's submission is in — the assessment is meaningful now. */
  submitted: boolean;
};

export function PeerContributionPanel({
  tugasanId,
  teammates,
  initialRatings,
  initialSelfDescription,
  submitted,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const hasSubmittedPeer = initialRatings.length > 0;

  // Rating state keyed by rateeId.
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const t of teammates) {
      init[t.id] = initialRatings.find((r) => r.rateeId === t.id)?.score ?? 50;
    }
    return init;
  });
  const [comments, setComments] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const t of teammates) {
      init[t.id] = initialRatings.find((r) => r.rateeId === t.id)?.comment ?? "";
    }
    return init;
  });
  const [selfText, setSelfText] = useState(initialSelfDescription ?? "");

  function savePeer() {
    startTransition(async () => {
      const ratings = teammates.map((t) => ({
        rateeId: t.id,
        score: scores[t.id] ?? 50,
        comment: comments[t.id]?.trim() || undefined,
      }));
      const res = await submitPeerAssessment({ tugasanId, ratings });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Penilaian rakan sekumpulan disimpan." });
      router.refresh();
    });
  }

  function saveSelf() {
    if (!selfText.trim()) {
      toast.push({ kind: "error", message: "Sila terangkan sumbangan anda." });
      return;
    }
    startTransition(async () => {
      const res = await submitSelfDeclaration({ tugasanId, description: selfText });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Sumbangan sendiri disimpan." });
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      {/* Reminder banner until the peer assessment is submitted. */}
      {submitted && !hasSubmittedPeer && (
        <div className="flex items-start gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Penilaian rakan sekumpulan belum dihantar</p>
            <p className="text-xs text-amber-700">
              Sila nilai sumbangan setiap ahli kumpulan anda untuk tugasan ini.
            </p>
          </div>
        </div>
      )}

      {/* Self-declared contribution */}
      <div className="card space-y-2">
        <header className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-ukm-teal" />
          <h3 className="text-base font-semibold text-ukm-navy">Sumbangan Sendiri</h3>
        </header>
        <p className="text-xs text-slate-500">
          Terangkan apa yang anda sumbangkan kepada tugasan kumpulan ini.
        </p>
        <textarea
          value={selfText}
          onChange={(e) => setSelfText(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Contoh: Saya menyediakan bahagian metodologi dan menyunting laporan akhir…"
          className="input-base resize-y"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={saveSelf}
          disabled={isPending}
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          {isPending ? <LoadingSpinner /> : <Save size={15} />}
          Simpan Sumbangan
        </button>
      </div>

      {/* Peer assessment */}
      {teammates.length > 0 && (
        <div className="card space-y-3">
          <header className="flex items-center gap-2">
            <Users size={18} className="text-ukm-teal" />
            <h3 className="text-base font-semibold text-ukm-navy">
              Penilaian Rakan Sekumpulan
            </h3>
          </header>
          <p className="text-xs text-slate-500">
            Nilai sumbangan setiap ahli (0–100). Penilaian ini hanya dilihat oleh pensyarah.
          </p>

          <ul className="space-y-3">
            {teammates.map((t) => (
              <li key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ukm-navy">{t.name}</p>
                    {t.matricNum && (
                      <p className="font-mono text-[10px] text-slate-400">{t.matricNum}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-sm font-bold tabular-nums text-ukm-teal shadow-soft">
                    {scores[t.id] ?? 50}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={scores[t.id] ?? 50}
                  onChange={(e) =>
                    setScores((s) => ({ ...s, [t.id]: Number(e.target.value) }))
                  }
                  disabled={isPending}
                  className="mt-2 w-full accent-ukm-teal"
                />
                <input
                  type="text"
                  value={comments[t.id] ?? ""}
                  onChange={(e) =>
                    setComments((c) => ({ ...c, [t.id]: e.target.value }))
                  }
                  maxLength={1000}
                  placeholder="Komen (pilihan)"
                  className="input-base mt-2 text-sm"
                  disabled={isPending}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={savePeer}
            disabled={isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isPending ? <LoadingSpinner /> : <ClipboardCheck size={16} />}
            {hasSubmittedPeer ? "Kemas Kini Penilaian" : "Hantar Penilaian"}
          </button>
        </div>
      )}
    </section>
  );
}
