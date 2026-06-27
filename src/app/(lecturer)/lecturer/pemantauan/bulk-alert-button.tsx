"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MessageCircleWarning } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { sendInactivityWarnings } from "@/server/actions/warnings";

type Row = {
  studentId: number;
  studentName: string;
  matricNum: string | null;
  submitted: number;
  totalAssignments: number;
};

type Props = {
  courseId: number;
  courseCode: string;
  rows: Row[];
};

/**
 * Top-right bulk "Hantar Amaran" control for Progress Monitoring. Targets every
 * inactive student (has assignments but zero submissions). The "Penggunaan
 * Pelajar" progress-bar section that used to wrap this was removed in the Stage 3
 * redesign — only the action survives.
 */
export function BulkAlertButton({ courseId, courseCode, rows }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    `Anda telah dikesan tidak aktif dalam ${courseCode}. Sila hubungi pensyarah dan kemaskini penghantaran anda secepat mungkin.`,
  );

  const inactiveStudents = useMemo(
    () => rows.filter((r) => r.totalAssignments > 0 && r.submitted === 0),
    [rows],
  );

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    const studentIds = inactiveStudents.map((s) => s.studentId);
    if (studentIds.length === 0) {
      toast.push({ kind: "error", message: "Tiada pelajar tidak aktif." });
      return;
    }
    startTransition(async () => {
      const res = await sendInactivityWarnings({ courseId, studentIds, message });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: `Amaran dihantar kepada ${res.data.count} pelajar.`,
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={inactiveStudents.length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-ukm-red px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircleWarning size={14} />
        Hantar Amaran ({inactiveStudents.length})
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Hantar amaran kepada ${inactiveStudents.length} pelajar`}
      >
        <form onSubmit={onSend} className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p className="flex items-start gap-1.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Amaran akan dihantar sebagai notifikasi kepada setiap pelajar tidak aktif dalam{" "}
                <strong>{courseCode}</strong>. Tindakan ini tidak boleh dipulihkan.
              </span>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Mesej amaran
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              minLength={5}
              maxLength={800}
              className="input-base resize-none"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Pelajar akan melihat tajuk &quot;Amaran ({courseCode}): &lt;nama anda&gt;&quot;.
            </p>
          </div>

          <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-ukm-navy">
              Penerima ({inactiveStudents.length})
            </summary>
            <ul className="mt-2 max-h-40 overflow-y-auto">
              {inactiveStudents.map((s) => (
                <li key={s.studentId} className="flex justify-between py-0.5">
                  <span>{s.studentName}</span>
                  <span className="font-mono text-slate-400">{s.matricNum ?? "—"}</span>
                </li>
              ))}
            </ul>
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={pending} className="btn-danger">
              {pending ? "Menghantar…" : "Hantar Amaran"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
