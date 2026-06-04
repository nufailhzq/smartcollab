import { Fragment } from "react";

export type DonutSegment = {
  label: string;
  value: number;
  /** Tailwind hex / CSS color (e.g. "#10b981"). */
  color: string;
};

type Props = {
  segments: DonutSegment[];
  /** Headline number shown in the center (e.g. total). */
  centerValue?: string | number;
  /** Smaller label under centerValue. */
  centerLabel?: string;
  /** Outer SVG size in px. Defaults to 180. */
  size?: number;
};

/**
 * Pure-SVG donut chart. Renders one ring slice per segment, sized
 * proportionally to its value. When all segments are zero, falls back to a
 * dim "empty" ring so the layout doesn't collapse.
 */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 180,
}: Props) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const radius = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 22;

  // Empty state — no data.
  if (total === 0) {
    return (
      <div className="grid place-items-center">
        <svg width={size} height={size} role="img" aria-label="Tiada data">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            className="fill-slate-400 text-sm"
          >
            {centerValue ?? "—"}
          </text>
          {centerLabel && (
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {centerLabel}
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Build arc segments using stroke-dasharray on a circle (one circle per slice
  // rotated so they sit end-to-end). Simpler than computing path arcs and works
  // for arbitrary slice counts.
  const circumference = 2 * Math.PI * radius;
  let offsetSoFar = 0;

  return (
    <div className="grid place-items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Carta donut: ${segments
          .map((s) => `${s.label} ${s.value}`)
          .join(", ")}`}
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {segments.map((s, i) => {
          if (s.value <= 0) return null;
          const fraction = s.value / total;
          const length = fraction * circumference;
          const dashArray = `${length} ${circumference - length}`;
          const dashOffset = -offsetSoFar;
          offsetSoFar += length;
          return (
            <Fragment key={`${s.label}-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
              >
                <title>{`${s.label}: ${s.value} (${Math.round(fraction * 100)}%)`}</title>
              </circle>
            </Fragment>
          );
        })}
        {centerValue !== undefined && (
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            className="fill-slate-800 text-xl font-bold"
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] uppercase tracking-wider"
          >
            {centerLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
