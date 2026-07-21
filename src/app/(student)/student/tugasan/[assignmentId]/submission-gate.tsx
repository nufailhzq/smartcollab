"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Circle,
  ClipboardCheck,
  FileCheck,
  Lock,
  MessageSquare,
  Send,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDateTime } from "@/lib/utils";
import { submitAssignment, withdrawSubmission } from "@/server/actions/assignments";
import {
  submitPeerAssessment,
  submitSelfDeclaration,
} from "@/server/actions/contribution";
import {
  PEER_SCORE_LABELS,
  PEER_SCORE_MAX,
  PEER_SCORE_MIN,
} from "@/schemas/contribution";
import type { SubmissionStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// SubmissionGate — the merged "Sumbangan Sendiri" + "Penilaian Rakan Sekumpulan"
// + file-submit flow for a GROUP tugasan. One cohesive card:
//   Step 1  self-declaration textarea   (done = non-empty trimmed text)
//   Step 2  peer sliders, untouched by default ("Belum dinilai") until moved
//           (done = every teammate slider explicitly interacted with)
// A "X/2 selesai" progress bar tracks completion. The file-submit button stays
// visible but is locked (opacity + lock icon + title hint) until both steps are
// done, then unlocks. On submit we persist the self-declaration + peer ratings
// via the existing server actions (backend re-validates), then submit the file
// via submitAssignment — which already notifies teammates to complete theirs.
// Peer-rating visibility (lecturer-only) is unchanged: this is UI/UX only.
// ─────────────────────────────────────────────────────────────────────────────

type Teammate = { id: number; name: string; matricNum: string | null };

type Submitter = { id: number; name: string; matricNum: string | null };

type Existing = {
  id: number;
  filePath: string | null;
  grade: number | null;
  status: SubmissionStatus;
  submittedAt: Date;
  submittedBy: Submitter | null;
  feedback: { id: number; comment: string; lecturerName: string; createdAt: Date }[];
};

type Props = {
  assignmentId: number;
  currentUserId: number;
  teammates: Teammate[]; // excludes the viewer
  initialRatings: { rateeId: number; score: number; comment: string | null }[];
  initialSelfDescription: string | null;
  existing: Existing | null;
  /** Lecturer has closed submissions and that moment passed. */
  closed: boolean;
  closeAt: string | null;
  /** Soft due date passed — still submittable, just LATE. */
  pastDue: boolean;
};

/** Recover the original filename from a stored submission path for display. */
function displayName(p: string): string {
  const tail = p.split(/[\\/]/).pop() ?? p;
  const idx = tail.indexOf("__");
  return idx >= 0 ? tail.slice(idx + 2) : tail;
}

export function SubmissionGate({
  assignmentId,
  currentUserId,
  teammates,
  initialRatings,
  initialSelfDescription,
  existing,
  closed,
  closeAt,
  pastDue,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [selfText, setSelfText] = useState(initialSelfDescription ?? "");
  const [file, setFile] = useState<File | null>(null);

  // Rating state keyed by rateeId, on the 1–5 activity scale. A teammate is only
  // considered rated once the student picks a button (or a rating was already
  // saved before). Untouched teammates have no score entry and display
  // "Belum dinilai" instead of a number.
  const initiallyTouched = useMemo(
    () => new Set(initialRatings.map((r) => r.rateeId)),
    [initialRatings],
  );
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const t of teammates) {
      const existing = initialRatings.find((r) => r.rateeId === t.id)?.score;
      if (existing !== undefined) init[t.id] = existing;
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
  const [touched, setTouched] = useState<Set<number>>(() => new Set(initiallyTouched));

  const rate = (rateeId: number, value: number) => {
    setScores((s) => ({ ...s, [rateeId]: value }));
    setTouched((prev) => {
      if (prev.has(rateeId)) return prev;
      const next = new Set(prev);
      next.add(rateeId);
      return next;
    });
  };

  // Completion signals.
  const step1Done = selfText.trim().length > 0;
  const step2Done = teammates.length === 0 || teammates.every((t) => touched.has(t.id));
  const doneCount = (step1Done ? 1 : 0) + (step2Done ? 1 : 0);
  const bothDone = step1Done && step2Done;
  const pct = Math.round((doneCount / 2) * 100);

  const canSubmit = bothDone && !!file && !closed && !isPending;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bothDone) {
      toast.push({
        kind: "error",
        message: "Lengkapkan sumbangan dan penilaian dahulu.",
      });
      return;
    }
    if (!file) {
      toast.push({ kind: "error", message: "Sila pilih fail terlebih dahulu." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.push({ kind: "error", message: "Saiz fail melebihi 10MB." });
      return;
    }

    startTransition(async () => {
      // 1) Persist the self-declaration.
      const selfRes = await submitSelfDeclaration({
        tugasanId: assignmentId,
        description: selfText,
      });
      if (!selfRes.ok) {
        toast.push({ kind: "error", message: selfRes.error });
        return;
      }

      // 2) Persist the peer ratings (only when there are teammates to rate).
      if (teammates.length > 0) {
        const ratings = teammates.map((t) => ({
          rateeId: t.id,
          score: scores[t.id] ?? PEER_SCORE_MIN,
          comment: comments[t.id]?.trim() || undefined,
        }));
        const peerRes = await submitPeerAssessment({ tugasanId: assignmentId, ratings });
        if (!peerRes.ok) {
          toast.push({ kind: "error", message: peerRes.error });
          return;
        }
      }

      // 3) Submit the file. The backend re-validates the gate and notifies the
      //    other group members to complete their own Sumbangan + Penilaian.
      const formData = new FormData();
      formData.set("assignmentId", String(assignmentId));
      formData.set("file", file);
      const res = await submitAssignment(formData);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Tugasan berjaya dihantar." });
      setFile(null);
      router.refresh();
    });
  }

  function onWithdraw() {
    if (
      !confirm(
        "Tarik balik penghantaran kumpulan ini? Fail akan dibuang untuk semua ahli.",
      )
    )
      return;
    const formData = new FormData();
    formData.set("assignmentId", String(assignmentId));
    startTransition(async () => {
      const res = await withdrawSubmission(formData);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Penghantaran ditarik balik." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Existing submission status (kept from the standard submission flow). */}
      {existing && (
        <article className="card border-emerald-500/30 bg-emerald-500/5">
          <header className="mb-2 flex items-center gap-2">
            <FileCheck className="text-emerald-300" size={18} />
            <h2 className="font-semibold">
              Status:{" "}
              {existing.status === "GRADED"
                ? "Dimarkah"
                : existing.status === "LATE"
                  ? "Penghantaran Lewat"
                  : "Dihantar"}
            </h2>
            {existing.status === "GRADED" && existing.grade !== null && (
              <span className="ml-auto rounded bg-emerald-500/20 px-2 py-1 text-sm font-bold">
                {existing.grade}
              </span>
            )}
          </header>
          <p className="text-xs text-slate-500">
            Dihantar pada {formatDateTime(existing.submittedAt)}
          </p>
          {existing.submittedBy && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-700">
              <UserCheck size={12} />
              <span>
                Dihantar oleh:{" "}
                <strong>
                  {existing.submittedBy.id === currentUserId
                    ? "Anda"
                    : existing.submittedBy.name}
                </strong>
                {existing.submittedBy.matricNum && existing.submittedBy.id !== currentUserId && (
                  <span className="ml-1 font-mono text-[10px] text-slate-500">
                    ({existing.submittedBy.matricNum})
                  </span>
                )}
              </span>
            </p>
          )}
          {existing.submittedBy && existing.submittedBy.id !== currentUserId && (
            <p className="mt-1 text-[11px] italic text-slate-500">
              Penghantaran dibuat bagi pihak kumpulan anda. Anda boleh hantar semula untuk
              gantikan fail.
            </p>
          )}
          {existing.filePath && (
            <a
              href={existing.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium text-ukm-teal hover:underline"
            >
              <FileCheck size={12} className="shrink-0" />
              <span className="truncate">{displayName(existing.filePath)}</span>
            </a>
          )}
          {existing.feedback.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <MessageSquare size={12} /> Maklum balas pensyarah
              </h3>
              {existing.feedback.map((f) => (
                <blockquote
                  key={f.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <p className="text-slate-700">{f.comment}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    — {f.lecturerName} · {formatDateTime(f.createdAt)}
                  </p>
                </blockquote>
              ))}
            </div>
          )}
          {/* Withdraw — remove the group's shared submission (unless graded/closed). */}
          {existing.status !== "GRADED" && !closed && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={onWithdraw}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ukm-red transition hover:bg-red-50 disabled:opacity-50"
              >
                {isPending ? <LoadingSpinner /> : <Trash2 size={13} />}
                Tarik balik penghantaran
              </button>
            </div>
          )}
        </article>
      )}

      {closed ? (
        <div className="card flex items-start gap-3 border-red-300/50 bg-red-50">
          <Lock className="mt-0.5 shrink-0 text-red-500" size={20} />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Penghantaran telah ditutup</p>
            <p className="text-xs text-red-600">
              Pensyarah telah menutup penghantaran untuk tugasan ini
              {closeAt ? ` pada ${formatDateTime(closeAt)}` : ""}. Anda tidak lagi boleh
              menghantar.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          {/* Progress header */}
          <header className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ukm-navy">
                Hantar Tugasan Kumpulan
              </h2>
              <span className="text-xs font-semibold tabular-nums text-slate-500">
                {doneCount}/2 selesai
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-ukm-teal transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </header>

          {/* Step 1 — Sumbangan Sendiri */}
          <section className="rounded-lg border border-slate-200 p-3">
            <header className="mb-1.5 flex items-center gap-2">
              <StepIcon done={step1Done} />
              <ClipboardCheck size={16} className="text-ukm-teal" />
              <h3 className="text-sm font-semibold text-ukm-navy">Sumbangan Sendiri</h3>
            </header>
            <p className="mb-2 text-xs text-slate-500">
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
          </section>

          {/* Step 2 — Penilaian Rakan Sekumpulan */}
          {teammates.length > 0 && (
            <section className="rounded-lg border border-slate-200 p-3">
              <header className="mb-1.5 flex items-center gap-2">
                <StepIcon done={step2Done} />
                <Users size={16} className="text-ukm-teal" />
                <h3 className="text-sm font-semibold text-ukm-navy">
                  Penilaian Rakan Sekumpulan
                </h3>
              </header>
              <p className="mb-2 text-xs text-slate-500">
                Nilai tahap keaktifan setiap ahli (1 = tidak aktif langsung, 5 = sangat
                aktif). Penilaian ini hanya dilihat oleh pensyarah.
              </p>

              <ul className="space-y-3">
                {teammates.map((t) => {
                  const isTouched = touched.has(t.id);
                  const current = scores[t.id];
                  return (
                    <li
                      key={t.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ukm-navy">
                            {t.name}
                          </p>
                          {t.matricNum && (
                            <p className="font-mono text-[10px] text-slate-400">
                              {t.matricNum}
                            </p>
                          )}
                        </div>
                        {isTouched && current !== undefined ? (
                          <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-ukm-teal shadow-soft">
                            {current} — {PEER_SCORE_LABELS[current - PEER_SCORE_MIN]}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                            Belum dinilai
                          </span>
                        )}
                      </div>
                      <div
                        role="radiogroup"
                        aria-label={`Penilaian keaktifan untuk ${t.name}`}
                        className="mt-2 flex gap-1.5"
                      >
                        {Array.from(
                          { length: PEER_SCORE_MAX - PEER_SCORE_MIN + 1 },
                          (_, i) => PEER_SCORE_MIN + i,
                        ).map((value) => {
                          const selected = current === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={`${value} — ${PEER_SCORE_LABELS[value - PEER_SCORE_MIN]}`}
                              title={PEER_SCORE_LABELS[value - PEER_SCORE_MIN]}
                              onClick={() => rate(t.id, value)}
                              disabled={isPending}
                              className={`flex-1 rounded-md border py-1.5 text-sm font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                selected
                                  ? "border-ukm-teal bg-ukm-teal text-white shadow-soft"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-ukm-teal hover:text-ukm-teal"
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-1 flex justify-between px-0.5 text-[10px] text-slate-400">
                        <span>{PEER_SCORE_LABELS[0]}</span>
                        <span>{PEER_SCORE_LABELS[PEER_SCORE_LABELS.length - 1]}</span>
                      </div>
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
                  );
                })}
              </ul>
            </section>
          )}

          {/* File + gated submit */}
          {pastDue && (
            <p className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
              <AlertTriangle size={12} /> Tarikh akhir telah berlalu — penghantaran anda akan
              ditanda sebagai &ldquo;Penghantaran Lewat&rdquo;.
            </p>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-ukm-teal hover:bg-slate-50">
            <Upload className="text-ukm-teal" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">{file ? file.name : "Klik untuk pilih fail"}</p>
              <p className="text-xs text-slate-500">PDF, DOCX, ZIP — sehingga 10 MB</p>
            </div>
            <input
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            title={
              bothDone ? undefined : "Lengkapkan sumbangan dan penilaian dahulu"
            }
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-soft transition ${
              bothDone
                ? "bg-ukm-orange hover:-translate-y-0.5 hover:bg-orange-600"
                : "cursor-not-allowed bg-slate-400 opacity-60"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isPending ? (
              <LoadingSpinner />
            ) : bothDone ? (
              <Send size={16} />
            ) : (
              <Lock size={16} />
            )}
            {existing ? "Hantar Semula" : "Hantar"}
          </button>
          {!bothDone && (
            <p className="text-[11px] text-slate-400">
              Lengkapkan Sumbangan Sendiri dan Penilaian Rakan Sekumpulan untuk membuka
              butang hantar.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ukm-teal text-white">
      <Check size={12} />
    </span>
  ) : (
    <Circle size={20} className="shrink-0 text-slate-300" />
  );
}
