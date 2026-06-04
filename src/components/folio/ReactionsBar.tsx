"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { SmilePlus } from "lucide-react";
import { ALLOWED_REACTIONS } from "@/schemas/folio";
import { toggleFolioReaction } from "@/server/actions/folio";

type ReactionRow = { id: number; emoji: string; userId: number };

type Props = {
  postId: number;
  reactions: ReactionRow[];
  viewerId: number;
  /** Hide the "+" picker (e.g. when the viewer is not a student). */
  readOnly?: boolean;
};

type Summary = { emoji: string; count: number; byMe: boolean };

function summarize(reactions: ReactionRow[], viewerId: number): Summary[] {
  const map = new Map<string, Summary>();
  for (const r of reactions) {
    const cur = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, byMe: false };
    cur.count++;
    if (r.userId === viewerId) cur.byMe = true;
    map.set(r.emoji, cur);
  }
  // Order: emojis with reactions first (by count desc), keeping ALLOWED order as tiebreak.
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (
      ALLOWED_REACTIONS.indexOf(a.emoji as (typeof ALLOWED_REACTIONS)[number]) -
      ALLOWED_REACTIONS.indexOf(b.emoji as (typeof ALLOWED_REACTIONS)[number])
    );
  });
}

export function ReactionsBar({ postId, reactions, viewerId, readOnly = false }: Props) {
  const [local, setLocal] = useState<ReactionRow[]>(reactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const pickerRef = useRef<HTMLDivElement>(null);

  // Resync when server-provided reactions change (e.g. after router.refresh).
  useEffect(() => {
    setLocal(reactions);
  }, [reactions]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    if (pickerOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pickerOpen]);

  function react(emoji: string) {
    // Optimistic toggle.
    setLocal((prev) => {
      const has = prev.some((r) => r.emoji === emoji && r.userId === viewerId);
      if (has) return prev.filter((r) => !(r.emoji === emoji && r.userId === viewerId));
      // Add a temporary client-side row (negative id signals "unsaved").
      return [...prev, { id: -Date.now(), emoji, userId: viewerId }];
    });
    setPickerOpen(false);

    startTransition(async () => {
      const res = await toggleFolioReaction({ postId, emoji });
      if (!res.ok) {
        // Roll back to the server truth on failure.
        setLocal(reactions);
        alert(res.error);
      }
    });
  }

  const summary = summarize(local, viewerId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {summary.map((s) => (
        <button
          key={s.emoji}
          type="button"
          onClick={() => !readOnly && react(s.emoji)}
          disabled={readOnly}
          aria-pressed={s.byMe}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
            s.byMe
              ? "border-ukm-teal/50 bg-sky-50 text-ukm-teal shadow-soft"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          } ${readOnly ? "cursor-default opacity-80" : "hover:-translate-y-0.5"}`}
        >
          <span className="text-sm leading-none">{s.emoji}</span>
          <span className="font-semibold tabular-nums">{s.count}</span>
        </button>
      ))}

      {!readOnly && (
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-2 py-1 text-xs text-slate-500 transition hover:-translate-y-0.5 hover:border-ukm-teal hover:text-ukm-teal"
            aria-label="Tambah reaksi"
            aria-expanded={pickerOpen}
          >
            <SmilePlus size={12} />
            {summary.length === 0 && <span>Reaksi</span>}
          </button>

          {pickerOpen && (
            <div className="absolute bottom-full left-0 z-30 mb-2 flex gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lift">
              {ALLOWED_REACTIONS.map((e) => {
                const mine = local.some((r) => r.emoji === e && r.userId === viewerId);
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => react(e)}
                    title={mine ? "Buang reaksi" : "Tambah reaksi"}
                    className={`grid h-8 w-8 place-items-center rounded-full text-lg transition hover:-translate-y-0.5 hover:bg-sky-50 ${
                      mine ? "bg-sky-100" : ""
                    }`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
