export type BarDatum = {
  label: string;
  value: number;
  /** Bar fill color (hex or CSS). */
  color: string;
};

type Props = {
  data: BarDatum[];
  /** Height of the plotting area in px. Defaults to 160. */
  height?: number;
  /** Y-axis label (e.g. "pelajar"). */
  yLabel?: string;
};

/**
 * Pure-SVG vertical bar chart. Bars are evenly spaced; value labels sit on
 * top of each bar; x labels under. Y-axis auto-scales to max(value) with a
 * small headroom so the tallest bar never touches the top edge.
 */
export function BarChart({ data, height = 160, yLabel }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  // Headroom: round max up to a nice number.
  const niceMax = Math.ceil(max * 1.15);
  const barWidthPct = 100 / data.length;
  const innerWidthPct = barWidthPct * 0.7; // 70% width, 30% gap
  const gridLines = 4;

  return (
    <div className="relative w-full" style={{ height: height + 36 }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 w-full"
        style={{ height }}
        role="img"
        aria-label={`Carta bar: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}
      >
        {/* Gridlines */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = (height / gridLines) * i;
          return (
            <line
              key={`grid-${i}`}
              x1={0}
              x2={100}
              y1={y}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {data.map((d, i) => {
          const x = i * barWidthPct + (barWidthPct - innerWidthPct) / 2;
          const h = (d.value / niceMax) * (height - 18);
          const y = height - h;
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={innerWidthPct}
                height={Math.max(h, 0)}
                fill={d.color}
                rx={1.2}
                ry={1.2}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </rect>
              {d.value > 0 && (
                <text
                  x={x + innerWidthPct / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-slate-700 text-[8px] font-semibold"
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* X-axis labels (HTML so font scales normally) */}
      <div
        className="absolute inset-x-0 grid"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          top: height + 4,
        }}
      >
        {data.map((d) => (
          <div
            key={`label-${d.label}`}
            className="text-center text-[10px] font-medium text-slate-500"
            title={d.label}
          >
            {d.label}
          </div>
        ))}
      </div>

      {yLabel && (
        <span className="absolute -left-1 top-0 -rotate-90 origin-top-left text-[9px] uppercase tracking-wider text-slate-400">
          {yLabel}
        </span>
      )}
    </div>
  );
}
