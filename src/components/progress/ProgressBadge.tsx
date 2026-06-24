import type { CompletionStatus } from "@/server/queries/progress";

/**
 * Visual mapping for the four derived completion states. Shared by the lecturer
 * grid and the student list so both stay consistent.
 */
export const STATUS_META: Record<
  CompletionStatus,
  { label: string; cls: string }
> = {
  GRADED: { label: "Dinilai", cls: "bg-emerald-100 text-emerald-700" },
  SUBMITTED: { label: "Dihantar", cls: "bg-sky-100 text-sky-700" },
  LATE: { label: "Lewat", cls: "bg-amber-100 text-amber-700" },
  NOT_STARTED: { label: "Belum mula", cls: "bg-slate-100 text-slate-500" },
};

export const STATUS_ORDER: CompletionStatus[] = [
  "GRADED",
  "SUBMITTED",
  "LATE",
  "NOT_STARTED",
];

export function ProgressBadge({ status }: { status: CompletionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

export function ProgressLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
      <span className="font-semibold uppercase tracking-wider">Petunjuk:</span>
      {STATUS_ORDER.map((s) => (
        <ProgressBadge key={s} status={s} />
      ))}
    </div>
  );
}
