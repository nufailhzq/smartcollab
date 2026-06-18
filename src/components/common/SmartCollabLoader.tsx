"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "fullscreen" | "overlay" | "inline";

/**
 * SmartCollab welcome loader — inspired by SmartBiz's aurora splash.
 *
 * - With `userName`: shows "Connecting to SmartCollab" (~1.8s), swaps to
 *   "Welcome, <name>" (~1.4s), then slowly fades over ~1.2s.
 * - Without `userName`: stays on "Connecting…" with the loading bar until
 *   unmounted by the caller.
 */
export function SmartCollabLoader({
  variant = "fullscreen",
  userName,
  message,
  className,
  onDone,
}: {
  variant?: Variant;
  userName?: string | null;
  message?: string;
  className?: string;
  onDone?: () => void;
}) {
  type Phase = "connecting" | "welcome" | "fading" | "hidden";
  const hasSequence = Boolean(userName && userName.trim().length > 0);
  const [phase, setPhase] = useState<Phase>("connecting");

  useEffect(() => {
    if (!hasSequence) return;
    const t1 = setTimeout(() => setPhase("welcome"), 1800);
    const t2 = setTimeout(() => setPhase("fading"), 3200);
    const t3 = setTimeout(() => {
      setPhase("hidden");
      onDone?.();
    }, 4400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hasSequence, onDone]);

  // Lock body scroll while a fullscreen loader is visible.
  useEffect(() => {
    if (variant !== "fullscreen") return;
    if (phase === "hidden") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [variant, phase]);

  if (phase === "hidden") return null;

  const wrapper =
    variant === "fullscreen"
      ? "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden aurora-bg"
      : variant === "overlay"
        ? "absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
        : "flex flex-col items-center justify-center gap-4 py-10";

  const title =
    phase === "welcome" && userName
      ? `Welcome, ${userName}`
      : "Connecting to SmartCollab";
  const sub =
    phase === "welcome"
      ? "Ruang anda sudah sedia"
      : message ?? "Menyambungkan sesi anda...";

  return (
    <div
      className={cn(
        wrapper,
        "transition-opacity duration-1000 ease-out",
        phase === "fading" ? "opacity-0" : "opacity-100",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* drifting aurora blobs */}
      {variant === "fullscreen" && (
        <>
          <div className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] animate-bg-drift rounded-full bg-sky-400/30 blur-3xl" />
          <div
            className="pointer-events-none absolute -right-32 bottom-10 h-[32rem] w-[32rem] animate-bg-drift rounded-full bg-orange-300/25 blur-3xl"
            style={{ animationDelay: "5s" }}
          />
          <div
            className="pointer-events-none absolute left-1/3 -bottom-32 h-80 w-80 animate-bg-drift rounded-full bg-cyan-300/20 blur-3xl"
            style={{ animationDelay: "10s" }}
          />
        </>
      )}

      <div className="relative z-10 px-6 text-center">
        {/* Conic gradient ring with white core + SmartCollab logo */}
        <div className="mx-auto mb-9 grid h-32 w-32 animate-float-soft place-items-center rounded-full shadow-[0_0_60px_-6px_rgba(14,165,233,0.55)] [background:conic-gradient(from_0deg,#0ea5e9,#22d3ee,#f97316,#fb923c,#0ea5e9)]">
          <div className="grid h-[7.25rem] w-[7.25rem] animate-pulse-soft place-items-center rounded-full bg-white shadow-inner">
            <Image
              src="/images/logo/SmartCollabLogo.png"
              alt="SmartCollab"
              width={78}
              height={78}
              priority
              className="h-[4.6rem] w-[4.6rem] animate-[spin_2.5s_linear_infinite] object-contain"
            />
          </div>
        </div>

        {/* Gradient title — swaps phrase with a soft fade */}
        <h1
          key={title}
          className="aurora-title animate-phrase-in"
          aria-live="polite"
        >
          {title}
        </h1>
        <p
          key={sub}
          className="aurora-sub mt-3 animate-phrase-in"
          style={{ animationDelay: "60ms" }}
        >
          {sub}
        </p>

        {/* Indeterminate loading bar (hidden on the welcome phase) */}
        <div
          className={cn(
            "mx-auto mt-9 h-[5px] w-56 overflow-hidden rounded-full bg-indigo-500/15 transition-opacity duration-500",
            phase === "welcome" ? "opacity-0" : "opacity-100",
          )}
        >
          <span className="block h-full w-[42%] animate-loading-bar rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-500" />
        </div>
      </div>

      <span className="sr-only">Loading</span>
    </div>
  );
}
