"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { saveMonitoringNote } from "@/server/actions/monitoring-notes";
import { MONITORING_NOTE_MAX_LENGTH } from "@/schemas/monitoring-note";

type Props = {
  courseId: number;
  studentId: number;
  initialNote: string;
};

/**
 * Inline-editable Catatan cell for the lecturer monitoring table. Click the
 * note (or the pencil) to switch to a textarea; Save commits via server
 * action, Cancel reverts.
 */
export function EditableNoteCell({ courseId, studentId, initialNote }: Props) {
  const [note, setNote] = useState(initialNote);
  const [draft, setDraft] = useState(initialNote);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(note);
    setEditing(true);
    setError(null);
  }

  function cancel() {
    setDraft(note);
    setEditing(false);
    setError(null);
  }

  function save() {
    if (draft === note) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await saveMonitoringNote({ courseId, studentId, note: draft });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNote(res.data.note);
      setEditing(false);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    }
  }

  if (editing) {
    const remaining = MONITORING_NOTE_MAX_LENGTH - draft.length;
    return (
      <div className="min-w-[180px] space-y-1">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={MONITORING_NOTE_MAX_LENGTH + 50}
          rows={2}
          placeholder="Catatan untuk pelajar ini…"
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-ukm-teal focus:ring-2 focus:ring-sky-500/15"
        />
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] tabular-nums ${
              remaining < 0
                ? "font-semibold text-ukm-red"
                : remaining < 40
                  ? "text-amber-600"
                  : "text-slate-400"
            }`}
          >
            {remaining}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="grid h-6 w-6 place-items-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-ukm-red"
              aria-label="Batal"
              title="Batal (Esc)"
            >
              <X size={12} />
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || remaining < 0}
              className="grid h-6 w-6 place-items-center rounded bg-ukm-teal text-white transition hover:bg-cyan-600 disabled:opacity-40"
              aria-label="Simpan"
              title="Simpan (Ctrl+Enter)"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            </button>
          </div>
        </div>
        {error && <p className="text-[10px] text-ukm-red">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="group/note flex w-full max-w-[220px] items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-xs text-slate-700 transition hover:bg-slate-50"
      title="Klik untuk edit"
    >
      <span className="flex-1 whitespace-pre-line">
        {note ? (
          note
        ) : (
          <span className="italic text-slate-400">Tambah catatan…</span>
        )}
      </span>
      <Pencil
        size={11}
        className="mt-0.5 shrink-0 text-slate-300 transition group-hover/note:text-ukm-teal"
      />
    </button>
  );
}
