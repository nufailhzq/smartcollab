"use client";

import { useEffect, useState } from "react";

type Props = {
  /** 0–100. */
  value: number;
  /** Pixel diameter of the ring. */
  size?: number;
  /** Ring thickness as a fraction of the radius (0–1). */
  thickness?: number;
  from?: string;
  to?: string;
  label?: string;
};

/**
 * Animated conic progress ring. Pure CSS conic-gradient (see `.progress-ring`
 * in globals.css) plus a count-up of the centre number. No SVG, no deps.
 * The fill animates from 0 → value on mount via a one-frame state bump.
 */
export function ProgressRing({
  value,
  size = 76,
  thickness = 0.16,
  from = "#0ea5e9",
  to = "#22d3ee",
  label,
}: Props) {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Animate the number alongside the CSS ring fill.
    let raf = 0;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const inner = Math.round(size * (1 - thickness));

  return (
    <div
      className="progress-ring grid shrink-0 place-items-center rounded-full"
      style={
        {
          width: size,
          height: size,
          "--pct": shown,
          "--ring-from": from,
          "--ring-to": to,
        } as React.CSSProperties
      }
    >
      <div
        className="grid place-items-center rounded-full bg-white shadow-soft"
        style={{ width: inner, height: inner }}
      >
        <span className="text-base font-extrabold tabular-nums text-ukm-navy">
          {shown}
          <span className="text-[10px] font-bold text-slate-400">%</span>
        </span>
        {label && (
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
