"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MessageCircleWarning, Users } from "lucide-react";
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

export function ActivityOverview({ courseId, courseCode, rows }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    `Anda telah dikesan tidak aktif dalam ${courseCode}. Sila hubungi pensyarah dan kemaskini penghantaran anda secepat mungkin.`,
  );

  const stats = useMemo(() => {
    const total = rows.length;
    // "Active" = student has at least one submission OR there are no assignments yet.
    const active = rows.filter((r) => r.totalAssignments === 0 || r.submitted > 0).length;
    const inactive = total - active;
    const inactiveStudents = rows.filter(
      (r) => r.totalAssignments > 0 && r.submitted === 0,
    );
    return {
      total,
      active,
      inactive,
      activePct: total ? Math.round((active / total) * 100) : 0,
      inactivePct: total ? Math.round((inactive / total) * 100) : 0,
      inactiveStudents,
    };
  }, [rows]);

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    const studentIds = stats.inactiveStudents.map((s) => s.studentId);
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
    <section className="card-elevated space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ukm-navy">
            <Users size={16} className="text-ukm-teal" /> Penggunaan Pelajar
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Pelajar dengan sekurang-kurangnya satu penghantaran dianggap aktif.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={stats.inactive === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-ukm-red px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageCircleWarning size={14} />
          Hantar Amaran ({stats.inactive})
        </button>
      </header>

      {/* Stacked bar */}
      <div>
        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
          title={`Aktif ${stats.active} · Tidak aktif ${stats.inactive}`}
          role="img"
          aria-label={`${stats.activePct}% aktif, ${stats.inactivePct}% tidak aktif`}
        >
          {stats.active > 0 && (
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats.activePct}%` }}
            />
          )}
          {stats.inactive > 0 && (
            <div
              className="bg-ukm-red transition-all duration-500"
              style={{ width: `${stats.inactivePct}%` }}
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Aktif: {stats.active} ({stats.activePct}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ukm-red" />
            Tidak aktif: {stats.inactive} ({stats.inactivePct}%)
          </span>
          <span className="text-slate-400">Jumlah: {stats.total} pelajar</span>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Hantar amaran kepada ${stats.inactive} pelajar`}
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
              Pelajar akan melihat tajuk &quot;⚠️ Amaran ({courseCode}): &lt;nama anda&gt;&quot;.
            </p>
          </div>

          <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-ukm-navy">
              Penerima ({stats.inactive})
            </summary>
            <ul className="mt-2 max-h-40 overflow-y-auto">
              {stats.inactiveStudents.map((s) => (
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
    </section>
  );
}
