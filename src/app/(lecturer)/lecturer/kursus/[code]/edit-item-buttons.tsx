"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { updateCourseContent, updateAssignment } from "@/server/actions/content";

// ─────────────────────────────────────────────────────────────────────────────
// Lecturer edit controls for course items. Mirrors DeleteItemButton: a small
// pencil that opens a modal form, submits via the update actions, then refreshes.
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a Date-ish value to the value expected by <input type=datetime-local>. */
function toLocalInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  // Local time, trimmed to minutes.
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

// ── Edit note / announcement / general content ───────────────────────────────

export function EditContentButton({
  id,
  initialTitle,
  initialContent,
}: {
  id: number;
  initialTitle: string;
  initialContent: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updateCourseContent({ contentId: id, title, content });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kandungan dikemas kini." });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sunting ${initialTitle}`}
        title="Sunting"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-ukm-teal"
      >
        <Pencil size={16} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Sunting Kandungan">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Tajuk</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Kandungan</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={10000}
              className="input-base resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Batal
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isPending ? <LoadingSpinner /> : <Save size={15} />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Edit assignment (incl. close-submission toggle) ──────────────────────────

export function EditAssignmentButton({
  id,
  initialTitle,
  initialDescription,
  initialDueDate,
  initialMaxGrade,
  initialSubmissionCloseAt,
}: {
  id: number;
  initialTitle: string;
  initialDescription: string | null;
  initialDueDate: string | null;
  initialMaxGrade: number | null;
  initialSubmissionCloseAt: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [dueDate, setDueDate] = useState(toLocalInput(initialDueDate));
  const [maxGrade, setMaxGrade] = useState(initialMaxGrade ?? 100);
  // Close-submission toggle: ON when a cutoff is set. The datetime is optional —
  // blank while ON means "close immediately" (server stamps now on save).
  const [closeOn, setCloseOn] = useState(Boolean(initialSubmissionCloseAt));
  const [closeAt, setCloseAt] = useState(toLocalInput(initialSubmissionCloseAt));
  const [isPending, startTransition] = useTransition();

  function save() {
    // When the toggle is on but no datetime chosen, close immediately (now).
    const submissionCloseAt = closeOn ? closeAt || new Date().toISOString() : "";
    startTransition(async () => {
      const res = await updateAssignment({
        assignmentId: id,
        title,
        description,
        dueDate,
        maxGrade,
        submissionCloseAt,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Tugasan dikemas kini." });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sunting ${initialTitle}`}
        title="Sunting tugasan"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-ukm-teal"
      >
        <Pencil size={16} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Sunting Tugasan">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Tajuk</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Penerangan</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={10000}
              className="input-base resize-y"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">Tarikh Akhir</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">Markah Penuh</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxGrade}
                onChange={(e) => setMaxGrade(Number(e.target.value))}
                className="input-base"
              />
            </div>
          </div>

          {/* Close-submission toggle */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={closeOn}
                onChange={(e) => setCloseOn(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-ukm-teal focus:ring-ukm-teal"
              />
              <span className="text-sm font-semibold text-ukm-navy">Tutup Penghantaran</span>
            </label>
            <p className="mt-1 text-[11px] text-slate-500">
              Jika dimatikan, pelajar boleh terus menghantar (lewat ditanda sebagai
              &ldquo;Penghantaran Lewat&rdquo;). Jika dihidupkan, penghantaran ditutup pada masa di
              bawah, atau serta-merta jika dibiarkan kosong.
            </p>
            {closeOn && (
              <input
                type="datetime-local"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
                className="input-base mt-2 sm:max-w-[260px]"
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Batal
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isPending ? <LoadingSpinner /> : <Save size={15} />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
