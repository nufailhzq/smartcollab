import type { CourseProgress } from "@/server/queries/progress";
import { ProgressBadge } from "./ProgressBadge";

/**
 * Student variant of the progress view: their own row(s) only, rendered as a
 * simple assignment -> badge list. Reuses the same getCourseProgress data path
 * as the lecturer grid (which already filters to the student's own rows).
 */
export function ProgressList({ data }: { data: CourseProgress }) {
  if (data.assignments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
        Tiada tugasan untuk dipantau lagi.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.rows.map((row) => (
        <div key={row.key} className="card">
          <h4 className="mb-3 text-sm font-semibold text-ukm-navy">{row.label}</h4>
          <ul className="divide-y divide-slate-100">
            {data.assignments.map((a) => {
              const status = row.cells[a.id];
              if (!status) return null;
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-700">{a.title}</span>
                  <ProgressBadge status={status} />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {data.rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
          Anda belum berada dalam mana-mana kumpulan untuk kursus ini.
        </p>
      )}
    </div>
  );
}
