"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileCheck, MessageSquare, UserCheck } from "lucide-react";
import { submitAssignment } from "@/server/actions/assignments";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDateTime } from "@/lib/utils";
import type { SubmissionStatus } from "@prisma/client";

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
  existing: Existing | null;
  isGroupAssignment: boolean;
  currentUserId: number;
};

/** Recover the original filename from a stored submission path for display. */
function displayName(p: string): string {
  const tail = p.split(/[\\/]/).pop() ?? p;
  const idx = tail.indexOf("__");
  return idx >= 0 ? tail.slice(idx + 2) : tail;
}

export function SubmissionForm({ assignmentId, existing, isGroupAssignment, currentUserId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.push({ kind: "error", message: "Sila pilih fail terlebih dahulu." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.push({ kind: "error", message: "Saiz fail melebihi 10MB." });
      return;
    }
    const formData = new FormData();
    formData.set("assignmentId", String(assignmentId));
    formData.set("file", file);
    startTransition(async () => {
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

  return (
    <div className="space-y-4">
      {existing ? (
        <article className="card border-emerald-500/30 bg-emerald-500/5">
          <header className="mb-2 flex items-center gap-2">
            <FileCheck className="text-emerald-300" size={18} />
            <h2 className="font-semibold">
              Status:{" "}
              {existing.status === "GRADED"
                ? "Dimarkah"
                : existing.status === "LATE"
                  ? "Lewat"
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
          {isGroupAssignment && existing.submittedBy && existing.submittedBy.id !== currentUserId && (
            <p className="mt-1 text-[11px] italic text-slate-500">
              Penghantaran dibuat bagi pihak kumpulan anda. Anda boleh hantar semula untuk gantikan fail.
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
        </article>
      ) : null}

      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-base font-semibold">
          {existing ? "Hantar semula" : "Hantar tugasan"}
        </h2>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-ukm-teal hover:bg-slate-50">
          <Upload className="text-ukm-teal" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {file ? file.name : "Klik untuk pilih fail"}
            </p>
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
          disabled={isPending || !file}
          className="btn-primary inline-flex items-center gap-2"
        >
          {isPending && <LoadingSpinner />}
          {existing ? "Hantar Semula" : "Hantar"}
        </button>
      </form>
    </div>
  );
}
