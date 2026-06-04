"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, Trash2, X } from "lucide-react";
import {
  adminDeleteFolioPost,
  dismissFolioReport,
} from "@/server/actions/folio";

type Props =
  | {
      kind: "delete";
      postId: number;
      authorName: string;
    }
  | {
      kind: "dismiss-one";
      reportId: number;
    };

/**
 * Two tiny action buttons used on the /admin/laporan page:
 *   - "dismiss-one" — flips a single report to RESOLVED without deleting the post.
 *   - "delete"      — opens a modal, takes a reason, deletes the post and pings
 *                     the author with the reason. All other reports for the post
 *                     cascade out.
 */
export function ReportActions(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (props.kind === "dismiss-one") {
    const { reportId } = props;
    return (
      <button
        type="button"
        onClick={() => {
          if (!confirm("Tolak laporan ini? Pos kekal.")) return;
          startTransition(async () => {
            const res = await dismissFolioReport({ reportId });
            if (!res.ok) {
              alert(res.error);
              return;
            }
            router.refresh();
          });
        }}
        disabled={pending}
        className="shrink-0 rounded-md p-1.5 text-amber-700 hover:bg-amber-200/50 disabled:opacity-40"
        title="Tolak laporan ini"
        aria-label="Tolak laporan"
      >
        <X size={14} />
      </button>
    );
  }

  // Delete-with-reason flow — props is now narrowed to the delete variant.
  const { postId, authorName } = props;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = reason.trim();
    if (r.length < 5) {
      alert("Sila berikan sebab (sekurang-kurangnya 5 aksara).");
      return;
    }
    startTransition(async () => {
      const res = await adminDeleteFolioPost({ postId, reason: r });
      if (!res.ok) {
        alert(res.error);
        return;
      }
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-danger"
      >
        <Trash2 size={14} /> Padam pos
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lift-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-ukm-red">
                <Trash2 size={16} />
                Padam pos {authorName}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pos akan dipadam kekal. {authorName} akan menerima notifikasi
                dengan sebab anda di bawah.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Melanggar dasar komuniti — kandungan kebencian. Sila baca dasar di /admin/dasar."
                rows={4}
                maxLength={800}
                className="input-base resize-none"
                autoFocus
              />
              <p className="text-[10px] text-slate-400">
                {reason.trim().length}/800 aksara · minimum 5
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending || reason.trim().length < 5}
                  className="btn-danger"
                >
                  <Send size={13} />
                  {pending ? "Memadam…" : "Padam & Notifikasi"}
                </button>
              </div>
            </form>

            <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
              <Check size={10} /> Semua laporan untuk pos ini akan dikosongkan
              secara automatik.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
