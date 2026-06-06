"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
};

// Track the most recent pointer position app-wide so a modal can open near
// wherever the user just clicked (e.g. an "Edit" button) instead of always
// snapping to dead-center. Updated on capture phase so it's current before any
// click handler opens the modal.
let lastPointer = { x: -1, y: -1 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
    },
    true,
  );
}

export function Modal({ open, onClose, title, children, className, footer }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  // null = not yet measured / fall back to centered.
  const [topPx, setTopPx] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // After the panel renders, place it vertically centered on the click point,
  // then clamp so it never spills past the top/bottom edges. Horizontally it
  // stays centered. If we have no pointer info, fall back to screen-centered.
  useLayoutEffect(() => {
    if (!open) {
      setTopPx(null);
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const margin = 16;
    const h = panel.offsetHeight;
    const vh = window.innerHeight;

    if (lastPointer.y < 0 || h >= vh - margin * 2) {
      // No click anchor, or panel too tall to move — center it.
      setTopPx(Math.max(margin, (vh - h) / 2));
      return;
    }

    let top = lastPointer.y - h / 2;
    top = Math.max(margin, Math.min(top, vh - h - margin));
    setTopPx(top);
  }, [open, children]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Positioning wrapper — owns left/top/translateX so it doesn't clash
          with the inner fade-in animation's own transform. */}
      <div
        ref={panelRef}
        style={
          topPx === null
            ? undefined
            : { top: `${topPx}px`, transform: "translateX(-50%)" }
        }
        className={cn(
          "absolute z-10 w-[calc(100%-2rem)] max-w-lg",
          // Until measured, render centered so there's no flash in the corner.
          topPx === null
            ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            : "left-1/2",
        )}
      >
        <div
          className={cn(
            "flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,39,68,0.25)] animate-fade-in",
            className,
          )}
        >
          <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-3">
            <h2 className="text-lg font-semibold text-ukm-navy">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
            >
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</footer>
          )}
        </div>
      </div>
    </div>
  );
}
