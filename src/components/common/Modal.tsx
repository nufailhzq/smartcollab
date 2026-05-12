"use client";

import { useEffect } from "react";
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

export function Modal({ open, onClose, title, children, className, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,39,68,0.25)] animate-fade-in",
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
  );
}
