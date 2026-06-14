"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Clock } from "lucide-react";

export type DeadlineRow = {
  id: number;
  title: string;
  courseCode: string;
  /** ISO string, or null if no due date. */
  dueDate: string | null;
  /** Submission state for this student. */
  state: "GRADED" | "SUBMITTED" | "NONE";
  href: string;
};

type Props = { rows: DeadlineRow[] };

const MONTHS = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
  "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis",
];

type Urgency = "due" | "soon" | "safe" | "done";

function urgencyOf(row: DeadlineRow): Urgency {
  if (row.state !== "NONE") return "done";
  if (!row.dueDate) return "safe";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(row.dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return "due";
  if (days <= 3) return "soon";
  return "safe";
}

function countdown(dueDate: string | null): string {
  if (!dueDate) return "Tiada tarikh akhir";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return `Lewat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini!";
  if (days === 1) return "Esok";
  return `${days} hari lagi`;
}

const STYLE: Record<
  Urgency,
  { card: string; dot: string; chip: string; Icon: typeof Clock }
> = {
  due: {
    card: "urgency-due",
    dot: "urgency-dot-due",
    chip: "bg-rose-100 text-rose-700",
    Icon: Clock,
  },
  soon: {
    card: "urgency-soon",
    dot: "urgency-dot-soon",
    chip: "bg-amber-100 text-amber-700",
    Icon: Clock,
  },
  safe: {
    card: "urgency-safe",
    dot: "urgency-dot-safe",
    chip: "bg-emerald-100 text-emerald-700",
    Icon: CalendarClock,
  },
  done: {
    card: "border-slate-200",
    dot: "bg-slate-300",
    chip: "bg-slate-100 text-slate-600",
    Icon: CheckCircle2,
  },
};

export function DeadlineTimeline({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarClock className="text-slate-300" size={30} />
        <p className="text-sm font-semibold text-ukm-navy">Semua selesai 🎉</p>
        <p className="text-xs text-slate-500">Tiada tugasan dengan tarikh akhir akan datang.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 pl-5">
      {/* vertical spine */}
      <span className="pointer-events-none absolute bottom-2 left-[5px] top-2 w-px bg-gradient-to-b from-sky-300 via-slate-200 to-transparent" />
      {rows.map((row, i) => {
        const u = urgencyOf(row);
        const s = STYLE[u];
        const due = new Date(row.dueDate ?? Date.now());
        return (
          <li
            key={row.id}
            className="relative animate-slide-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span
              className={`absolute -left-5 top-4 h-2.5 w-2.5 rounded-full ${s.dot} ${
                u === "due" ? "animate-glow-pulse" : ""
              }`}
            />
            <Link
              href={row.href}
              className={`group flex items-center gap-3 rounded-2xl border bg-white/80 px-3.5 py-3 backdrop-blur-sm transition-all duration-300 ease-spring hover:-translate-y-0.5 ${s.card}`}
            >
              {row.dueDate && (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-center leading-none">
                  <span className="text-sm font-extrabold text-ukm-navy">{due.getDate()}</span>
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {MONTHS[due.getMonth()]}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ukm-navy">{row.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ukm-orange">
                    {row.courseCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.chip}`}
                  >
                    <s.Icon size={10} />
                    {row.state === "GRADED"
                      ? "Dimarkah"
                      : row.state === "SUBMITTED"
                        ? "Dihantar"
                        : countdown(row.dueDate)}
                  </span>
                </div>
              </div>
              <ArrowRight
                size={15}
                className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ukm-teal"
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
