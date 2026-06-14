"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: number;
  Icon: LucideIcon;
  /** Tailwind gradient stops for the icon chip + accent, e.g. "from-sky-500 to-cyan-400". */
  gradient: string;
  /** rgba used for the hover glow shadow. */
  glow: string;
  href?: string;
  /** Stagger entrance, ms. */
  delay?: number;
};

/**
 * Glassy KPI tile with a count-up value and a gradient icon chip that glows on
 * hover. Presentation only — the value is computed server-side and passed in.
 */
export function StatTile({ label, value, Icon, gradient, glow, delay = 0 }: Props) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    // Count up once the tile scrolls into view (or immediately if already in).
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(value * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div
      ref={ref}
      className="glass-card bento-tile group relative overflow-hidden p-5 animate-slide-up"
      style={
        {
          animationDelay: `${delay}ms`,
          "--glow": glow,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 26px 50px -18px ${glow}, 0 0 28px -6px ${glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* faint gradient wash that lights up on hover */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-15 blur-2xl transition-opacity duration-500 group-hover:opacity-35`}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-soft transition-transform duration-300 ease-spring group-hover:-translate-y-0.5 group-hover:scale-105`}
        >
          <Icon size={22} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-extrabold tabular-nums text-ukm-navy">{shown}</p>
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
