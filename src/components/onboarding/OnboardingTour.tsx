"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { completeTutorial } from "@/server/actions/preferences";

// ─────────────────────────────────────────────────────────────────────────────
// First-time onboarding tour (Stage 6). A spotlight overlay darkens the page,
// cuts a hole around the highlighted element, and anchors a tooltip beside it.
//
// Steps target elements by a `data-tour="<key>"` attribute so the tour is
// decoupled from class names / DOM structure. A step whose target is missing on
// the current page is skipped automatically (e.g. role-specific nav items).
//
// Completing the last step OR clicking "Langkau" calls completeTutorial(), which
// flips hasCompletedTutorial = true in the DB so the tour never shows again.
// ─────────────────────────────────────────────────────────────────────────────

export type TourStep = {
  /** Matches a `data-tour="<target>"` attribute somewhere on the page. */
  target: string;
  title: string;
  body: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // spotlight padding around the target

export function OnboardingTour({ steps }: { steps: TourStep[] }) {
  const router = useRouter();
  const [active, setActive] = useState(true);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Resolve the visible steps (those whose target currently exists in the DOM).
  const resolveEl = useCallback(
    (i: number): HTMLElement | null =>
      typeof document === "undefined"
        ? null
        : document.querySelector<HTMLElement>(`[data-tour="${steps[i]?.target}"]`),
    [steps],
  );

  // Advance past steps whose target isn't on this page.
  const nextVisibleFrom = useCallback(
    (start: number, dir: 1 | -1): number => {
      let i = start;
      while (i >= 0 && i < steps.length) {
        if (resolveEl(i)) return i;
        i += dir;
      }
      return -1;
    },
    [resolveEl, steps.length],
  );

  // On mount, jump to the first visible step (or finish if none exist).
  useEffect(() => {
    const first = nextVisibleFrom(0, 1);
    if (first === -1) {
      void finish();
      return;
    }
    setIndex(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure the current target and keep the spotlight perfectly wrapped around
  // it. The previous version measured once right after a SMOOTH scroll, so the
  // rect was captured mid-animation and the box landed off-target. Now we:
  //   1. re-measure on every animation frame for ~500ms (covers the smooth
  //      scroll settling), then
  //   2. keep it synced via ResizeObserver (element/layout changes),
  //      window resize, and scroll — so it stays wrapped on responsive layouts
  //      and dynamic re-renders.
  useLayoutEffect(() => {
    if (!active) return;
    const el = resolveEl(index);
    if (!el) {
      setRect(null);
      return;
    }

    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    // Only scroll if the target isn't already fully in view — scrolling an
    // element that's already visible (e.g. the sticky-navbar logo) shifts the
    // page and lands the spotlight off-target.
    const r0 = el.getBoundingClientRect();
    const fullyInView =
      r0.top >= 0 && r0.bottom <= window.innerHeight && r0.left >= 0 && r0.right <= window.innerWidth;
    if (!fullyInView) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    measure();

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      measure();
      if (now - start < 600) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Keep wrapped if the element resizes or the layout reflows (responsive).
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.documentElement);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, active, resolveEl]);

  async function finish() {
    setActive(false);
    try {
      await completeTutorial();
    } catch {
      /* best-effort; the flag flip is idempotent on next load */
    }
    router.refresh();
  }

  function goNext() {
    const n = nextVisibleFrom(index + 1, 1);
    if (n === -1) void finish();
    else setIndex(n);
  }
  function goPrev() {
    const p = nextVisibleFrom(index - 1, -1);
    if (p !== -1) setIndex(p);
  }

  if (!active) return null;
  const step = steps[index];
  if (!step) return null;

  // Tooltip placement: below the target when there's room, else above.
  const spotlight = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const placeBelow = spotlight ? spotlight.top + spotlight.height < window.innerHeight - 200 : true;
  const tooltipStyle: React.CSSProperties = spotlight
    ? {
        top: placeBelow ? spotlight.top + spotlight.height + 12 : undefined,
        bottom: placeBelow ? undefined : window.innerHeight - spotlight.top + 12,
        left: Math.max(12, Math.min(spotlight.left, window.innerWidth - 332)),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  // Position counter (1-based) among ALL steps for a stable "x / n".
  const stepNumber = index + 1;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Tutorial">
      {/* Dark overlay with a transparent hole over the spotlight via box-shadow.
          FIXED (not absolute) so it uses the same viewport-relative coordinate
          space as getBoundingClientRect() — otherwise the highlight detaches
          from the target. */}
      {spotlight ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-ukm-orange transition-all duration-200"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.72)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-900/70" />
      )}

      {/* Tooltip card — also fixed, anchored to the (viewport-relative) spotlight. */}
      <div
        className="fixed w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl animate-fade-in"
        style={tooltipStyle}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ukm-orange">
            {stepNumber} / {steps.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
          >
            <X size={13} /> Langkau Tutorial
          </button>
        </div>
        <h3 className="text-base font-bold text-ukm-navy">{step.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={nextVisibleFrom(index - 1, -1) === -1}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={14} /> Sebelumnya
          </button>
          <button
            type="button"
            onClick={goNext}
            className="btn-primary inline-flex items-center gap-1 px-4 py-1.5 text-xs"
          >
            {nextVisibleFrom(index + 1, 1) === -1 ? "Selesai" : "Seterusnya"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
