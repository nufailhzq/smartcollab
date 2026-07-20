"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { setGroupFormationSettings } from "@/server/actions/group-access";

type Props = {
  courseId: number;
  selfService: boolean;
  maxMembers: number | null;
  /** ISO string or null. */
  closeAt: string | null;
};

const DEFAULT_MAX = 5;

// Convert an ISO instant to the value a <input type="datetime-local"> expects
// (local wall-clock, no timezone, minute precision).
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// Lecturer control over how students form standing groups: self-service (no
// approval) vs request→approve, the member cap, and a formation cutoff.
export function GroupFormationSettings({ courseId, selfService, maxMembers, closeAt }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [selfSvc, setSelfSvc] = useState(selfService);
  const [max, setMax] = useState<string>(maxMembers != null ? String(maxMembers) : "");
  const [close, setClose] = useState<string>(toLocalInput(closeAt));

  const save = () => {
    const parsedMax = max.trim() === "" ? null : Number(max);
    if (parsedMax !== null && (!Number.isInteger(parsedMax) || parsedMax < 1)) {
      return toast.push({ kind: "error", message: "Had ahli mesti nombor 1 atau lebih." });
    }
    // datetime-local yields local wall-clock; turn it into a real ISO instant.
    const closeIso = close ? new Date(close).toISOString() : "";
    startTransition(async () => {
      const res = await setGroupFormationSettings({
        courseId,
        selfService: selfSvc,
        maxMembers: parsedMax,
        closeAt: closeIso,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Tetapan pembentukan kumpulan disimpan." });
      router.refresh();
    });
  };

  return (
    <div
      className={`card-elevated space-y-4 border-l-4 transition-colors ${
        selfSvc ? "border-ukm-teal bg-sky-50/30" : "border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 place-items-center rounded-xl ${
              selfSvc ? "bg-ukm-teal/10 text-ukm-teal" : "bg-slate-100 text-slate-500"
            }`}
          >
            {selfSvc ? <Sparkles size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-ukm-navy">
              {selfSvc ? "Pelajar Buat Kumpulan Sendiri" : "Perlu Kelulusan Pensyarah"}
            </p>
            <p className="text-[11px] text-slate-500">
              {selfSvc
                ? "Kumpulan yang dibentuk pelajar terus diluluskan tanpa kelulusan anda."
                : "Setiap permohonan kumpulan menunggu kelulusan anda."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelfSvc((v) => !v)}
          role="switch"
          aria-checked={selfSvc}
          aria-label="Togol pembentukan kumpulan layan diri"
          className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ukm-teal focus:ring-offset-2 ${
            selfSvc ? "bg-ukm-teal" : "bg-slate-300"
          }`}
        >
          <span
            className={`flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-soft transition-transform ${
              selfSvc ? "translate-x-9" : "translate-x-1"
            }`}
          >
            {selfSvc ? (
              <Sparkles size={12} className="text-ukm-teal" />
            ) : (
              <ShieldCheck size={12} className="text-slate-500" />
            )}
          </span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users size={12} /> Had ahli setiap kumpulan
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder={`Lalai (${DEFAULT_MAX})`}
            className="input-base"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tarikh &amp; masa tutup pembentukan
          </span>
          <input
            type="datetime-local"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            className="input-base"
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          {close
            ? "Selepas tarikh tutup, pelajar tidak boleh membentuk kumpulan baharu."
            : "Tiada tarikh tutup — pelajar boleh membentuk kumpulan bila-bila masa."}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-ukm-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          Simpan Tetapan
        </button>
      </div>
    </div>
  );
}
