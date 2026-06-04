"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Zap } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { sendInactivityWarnings } from "@/server/actions/warnings";

type Reason =
  | "no-submission"
  | "missing"
  | "late"
  | "low-average"
  | "missing-streak"
  | "trend-down"
  | "active";

const PRESETS: Record<Reason, string> = {
  "no-submission":
    "Anda belum menghantar sebarang tugasan untuk kursus ini. Sila mulakan secepat mungkin atau hubungi pensyarah jika ada masalah.",
  missing:
    "Anda mempunyai tugasan yang masih belum dihantar. Sila semak senarai tugasan dan hantar sebelum tarikh tutup yang seterusnya.",
  late:
    "Penghantaran anda kerap lewat. Sila kemaskini jadual kerja anda atau hubungi pensyarah jika memerlukan bantuan.",
  "low-average":
    "Purata markah anda berada di bawah paras minimum. Sila datang untuk konsultasi supaya kita boleh tingkatkan prestasi anda.",
  "missing-streak":
    "Anda telah terlepas beberapa tugasan berturut-turut. Sila hubungi pensyarah secepat mungkin untuk perbincangan.",
  "trend-down":
    "Markah anda menunjukkan trend menurun. Sila kenalpasti punca dan datang untuk konsultasi jika perlu.",
  active:
    "Sila ambil perhatian terhadap prestasi anda dalam kursus ini. Hubungi pensyarah jika ada sebarang masalah.",
};

function pickReason(flagReason: string | null): Reason {
  if (!flagReason) return "active";
  const r = flagReason.toLowerCase();
  if (r.includes("tiada penghantaran")) return "no-submission";
  if (r.includes("berturut")) return "missing-streak";
  if (r.includes("belum dihantar")) return "missing";
  if (r.includes("rendah")) return "low-average";
  if (r.includes("menurun")) return "trend-down";
  if (r.includes("lewat")) return "late";
  return "active";
}

export function FastAlertButton({
  courseId,
  studentId,
  studentName,
  flagReason,
}: {
  courseId: number;
  studentId: number;
  studentName: string;
  flagReason: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const reason = pickReason(flagReason);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(PRESETS[reason]);
  const [pending, startTransition] = useTransition();

  const send = (msg: string) => {
    startTransition(async () => {
      const res = await sendInactivityWarnings({
        courseId,
        studentIds: [studentId],
        message: msg,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({
        kind: "success",
        message: `Amaran dihantar kepada ${studentName}.`,
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        title={`Amaran pantas untuk ${studentName}`}
        aria-label={`Hantar amaran pantas kepada ${studentName}`}
        className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Zap size={12} />
        Amaran
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lift animate-fade-in">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Mesej preset
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={800}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-ukm-teal focus:bg-white"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMessage(PRESETS[reason])}
                className="text-[11px] font-semibold text-slate-500 hover:text-ukm-navy"
              >
                Reset
              </button>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => send(message)}
                  disabled={pending || message.trim().length < 5}
                  className="inline-flex items-center gap-1 rounded-md bg-ukm-red px-2.5 py-1 text-[11px] font-bold text-white shadow-soft hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={11} />
                  {pending ? "Menghantar…" : "Hantar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
