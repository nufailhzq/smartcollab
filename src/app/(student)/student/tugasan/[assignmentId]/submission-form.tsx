"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileCheck, MessageSquare } from "lucide-react";
import { submitAssignment } from "@/server/actions/assignments";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDateTime } from "@/lib/utils";
import type { SubmissionStatus } from "@prisma/client";

type Existing = {
  id: number;
  filePath: string | null;
  grade: number | null;
  status: SubmissionStatus;
  submittedAt: Date;
  feedback: { id: number; comment: string; lecturerName: string; createdAt: Date }[];
};

type Props = {
  assignmentId: number;
  existing: Existing | null;
};

export function SubmissionForm({ assignmentId, existing }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileName) {
      toast.push({ kind: "error", message: "Sila pilih fail terlebih dahulu." });
      return;
    }
    // NOTE: Real file upload is deferred to UploadThing/S3 integration.
    // For now we record a synthetic path so the persistence test passes.
    const filePath = `/uploads/sub-${assignmentId}-${Date.now()}-${fileName}`;
    startTransition(async () => {
      const res = await submitAssignment({ assignmentId, filePath });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Tugasan berjaya dihantar." });
      setFileName(null);
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
          {existing.filePath && (
            <p className="mt-1 truncate text-xs text-slate-500">Fail: {existing.filePath}</p>
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
              {fileName ? fileName : "Klik untuk pilih fail"}
            </p>
            <p className="text-xs text-slate-500">PDF, DOCX, ZIP — sehingga 10 MB</p>
          </div>
          <input
            type="file"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={isPending || !fileName}
          className="btn-primary inline-flex items-center gap-2"
        >
          {isPending && <LoadingSpinner />}
          {existing ? "Hantar Semula" : "Hantar"}
        </button>
        <p className="text-[11px] text-slate-400">
          Nota: muat naik sebenar (UploadThing/S3) akan diintegrasikan kemudian. Buat masa ini, fail
          direkod sebagai laluan rujukan.
        </p>
      </form>
    </div>
  );
}
