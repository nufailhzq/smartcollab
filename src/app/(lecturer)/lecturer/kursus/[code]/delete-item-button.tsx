"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { deleteAssignment, deleteCourseContent } from "@/server/actions/content";

// ─────────────────────────────────────────────────────────────────────────────
// Lecturer delete control (Stage 7) for course items: Tugasan (assignment),
// Pengumuman + Nota & Bahan (course content). Shows a confirmation modal before
// deleting. The server actions already enforce that only the course's assigned
// lecturer may delete — this is the UI half.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  kind: "assignment" | "content";
  id: number;
  /** Item title, shown in the confirmation prompt. */
  label: string;
};

export function DeleteItemButton({ kind, id, label }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res =
        kind === "assignment"
          ? await deleteAssignment({ assignmentId: id })
          : await deleteCourseContent({ contentId: id });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Item telah dipadam." });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Padam ${label}`}
        title="Padam"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-ukm-red"
      >
        <Trash2 size={16} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Padam item ini?">
        <p className="text-sm text-slate-700">
          Anda pasti mahu memadam <strong>&ldquo;{label}&rdquo;</strong>? Tindakan ini tidak
          boleh dipulihkan.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="btn-danger inline-flex items-center gap-2"
          >
            {isPending ? <LoadingSpinner /> : <Trash2 size={15} />}
            Padam
          </button>
        </div>
      </Modal>
    </>
  );
}
