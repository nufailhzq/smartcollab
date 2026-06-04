"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const EMOJI_GROUPS: Array<{ label: string; emojis: readonly string[] }> = [
  {
    label: "Smileys",
    emojis: [
      "😀","😁","😂","🤣","😊","😍","😘","🥰","😎","😉",
      "🙂","😅","😇","🤔","😴","😭","😡","🥺","😱","🤩",
    ],
  },
  {
    label: "Gestures",
    emojis: [
      "👍","👎","👏","🙌","🙏","👌","✌️","🤝","💪","🫶",
      "👋","🤞","🤟","👇","👉","👈","☝️","✋","🤚","🫡",
    ],
  },
  {
    label: "Hearts & symbols",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💯",
      "🔥","✨","⭐","🎉","🎊","💡","✅","❌","⚠️","🚀",
    ],
  },
  {
    label: "Study & life",
    emojis: [
      "📚","📝","✏️","📖","📅","💻","🎓","🧠","☕","🍕",
      "🍔","⚽","🏀","🎵","📷","💬","🤖","🐱","🐶","🌧️",
    ],
  },
];

type Props = {
  /** Inserts an emoji character into the caller's text state. */
  onPick: (emoji: string) => void;
  /** Optional override label/icon for the trigger button. */
  triggerClassName?: string;
};

export function EmojiPicker({ onPick, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Emoji"
        title="Emoji"
        aria-expanded={open}
        className={
          triggerClassName ??
          "grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ukm-orange"
        }
      >
        <Smile size={18} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih emoji"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,39,68,0.18)]"
        >
          <div className="max-h-64 overflow-y-auto p-2">
            {EMOJI_GROUPS.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {g.label}
                </p>
                <div className="grid grid-cols-10 gap-0.5">
                  {g.emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        onPick(e);
                      }}
                      className="grid h-6 w-6 place-items-center rounded text-base leading-none transition hover:scale-110 hover:bg-slate-100"
                      title={e}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
