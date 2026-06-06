"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Right-side slide-in panel for edit/detail screens.
 *
 * Why a drawer instead of a centre modal?
 * - Centre modals block the page content the user is referencing.
 * - A drawer leaves the underlying list visible on desktop (450-560px wide)
 *   and slides up full-screen on mobile so it still gets the focus it needs.
 *
 * Props:
 *   open       — visibility flag
 *   onClose    — close handler (also fires on backdrop click + Escape)
 *   title      — sticky header title
 *   subtitle   — optional one-line caption below the title
 *   footer     — sticky action bar at the bottom (e.g. Save / Cancel buttons)
 *   width      — desktop max width: 'sm' (380px), 'md' (480px, default), 'lg' (640px)
 */
export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const widthClass =
    width === "sm"
      ? "sm:max-w-[380px]"
      : width === "lg"
        ? "sm:max-w-[640px]"
        : "sm:max-w-[480px]";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Panel — full-screen on mobile, right-anchored drawer on sm+ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-0 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-spring sm:left-auto sm:right-0 sm:top-0 sm:h-full",
          widthClass,
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-ukm-navy">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
