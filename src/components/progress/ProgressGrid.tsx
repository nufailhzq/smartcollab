import type { CourseProgress } from "@/server/queries/progress";
import { ProgressBadge, ProgressLegend } from "./ProgressBadge";

/**
 * Lecturer completion grid: rows (groups, or students for INDIVIDUAL) ×
 * assignment columns, each cell a derived status badge. A blank cell means the
 * row doesn't participate in that assignment's grouping (e.g. an ad-hoc group
 * only appears under its own CUSTOM/RANDOM assignment).
 */
export function ProgressGrid({ data }: { data: CourseProgress }) {
  if (data.assignments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
        Tiada tugasan untuk dipantau lagi.
      </p>
    );
  }
  if (data.rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
        Tiada kumpulan atau pelajar untuk dipaparkan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ProgressLegend />
      <div className="card overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white">Kumpulan / Pelajar</th>
              {data.assignments.map((a) => (
                <th key={a.id} className="min-w-[120px] text-center">
                  {a.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.key}>
                <td className="sticky left-0 z-10 bg-white font-semibold text-ukm-navy">
                  {row.label}
                </td>
                {data.assignments.map((a) => {
                  const status = row.cells[a.id];
                  return (
                    <td key={a.id} className="text-center">
                      {status ? (
                        <ProgressBadge status={status} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
