"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ClipboardCheck, FileText, MessageSquare, UserCheck } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { gradeSubmission } from "@/server/actions/grading";
import { formatDateTime } from "@/lib/utils";

type Feedback = {
  id: number;
  comment: string;
  lecturerName: string;
  createdAt: string;
};

type Submission = {
  id: number;
  studentId: number;
  studentName: string;
  studentMatric: string | null;
  submittedBy: { id: number; name: string; matricNum: string | null } | null;
  assignmentTitle: string;
  assignmentType: "INDIVIDUAL" | "GROUP";
  courseCode: string;
  courseTitle: string;
  filePath: string | null;
  grade: number | null;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "LATE";
  maxGrade: number;
  submittedAt: string;
  dueDate: string | null;
  feedback: Feedback[];
};

type Props = {
  submission: Submission;
};

const STATUS_BADGE: Record<Submission["status"], string> = {
  PENDING: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-sky-100 text-sky-700",
  LATE: "bg-amber-100 text-amber-700",
  GRADED: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<Submission["status"], string> = {
  PENDING: "Belum",
  SUBMITTED: "Dihantar",
  LATE: "Lewat",
  GRADED: "Dimarkah",
};

export function GradingPanel({ submission }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState<number | "">(submission.grade ?? "");
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (grade === "" || Number.isNaN(Number(grade))) {
      toast.push({ kind: "error", message: "Sila masukkan markah." });
      return;
    }
    startTransition(async () => {
      const res = await gradeSubmission({
        submissionId: submission.id,
        grade: Number(grade),
        feedback,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Markah disimpan." });
      setOpen(false);
      setFeedback("");
      router.refresh();
    });
  };

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-orange-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-ukm-orange">
              {submission.courseCode}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                submission.assignmentType === "GROUP"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {submission.assignmentType === "GROUP" ? "Kumpulan" : "Individu"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[submission.status]}`}>
              {STATUS_LABEL[submission.status]}
            </span>
          </div>
          <h3 className="mt-1 text-base font-semibold text-ukm-navy">{submission.assignmentTitle}</h3>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-ukm-navy">{submission.studentName}</span>
            {submission.studentMatric && (
              <span className="font-mono"> · {submission.studentMatric}</span>
            )}
            {" · Hantar "}
            {formatDateTime(submission.submittedAt)}
            {submission.dueDate && ` · Tarikh akhir ${formatDateTime(submission.dueDate)}`}
          </p>
          {submission.assignmentType === "GROUP" &&
            submission.submittedBy &&
            submission.submittedBy.id !== submission.studentId && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700">
                <UserCheck size={11} />
                Dihantar oleh {submission.submittedBy.name}
                {submission.submittedBy.matricNum && (
                  <span className="font-mono text-[10px] text-slate-500">
                    ({submission.submittedBy.matricNum})
                  </span>
                )}
              </p>
            )}
        </div>
        <div className="flex items-center gap-3 text-right">
          {submission.status === "GRADED" && submission.grade !== null && (
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {submission.grade}
                <span className="text-sm font-normal text-slate-400">/{submission.maxGrade}</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-emerald-700">Dimarkah</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={submission.status === "GRADED" ? "btn-secondary" : "btn-primary"}
          >
            <ClipboardCheck size={14} /> {submission.status === "GRADED" ? "Edit" : "Markah"}
          </button>
        </div>
      </header>

      {submission.filePath && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
          <FileText size={12} className="text-ukm-teal" /> {submission.filePath}
        </p>
      )}

      {submission.feedback.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {submission.feedback.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ukm-teal">
                <MessageSquare size={11} /> {f.lecturerName} · {formatDateTime(f.createdAt)}
              </p>
              <p className="mt-1 text-sm text-slate-700">{f.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Markah (max {submission.maxGrade})
            </label>
            <input
              type="number"
              min={0}
              max={submission.maxGrade}
              value={grade}
              onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="input-base w-32"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Maklum balas (opsyenal)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              maxLength={2000}
              className="input-base resize-y"
              placeholder="Komen, cadangan, atau penilaian…"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              <CheckCircle size={14} /> Simpan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
