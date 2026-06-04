import Link from "next/link";
import { Calendar, CalendarClock, ClipboardList, Inbox } from "lucide-react";
import type { UpcomingItem } from "@/server/queries/upcoming";

type Props = { items: UpcomingItem[] };

const MONTHS = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogo",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
];

function formatDayMonth(d: Date) {
  return { day: d.getDate(), month: MONTHS[d.getMonth()] ?? "" };
}

function dayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Esok";
  const weekdays = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  return weekdays[d.getDay()] ?? "";
}

export function UpcomingEventsPanel({ items }: Props) {
  return (
    <section className="card overflow-hidden p-0">
      <header className="flex items-center gap-2 border-b border-slate-100 bg-ukm-teal px-3 py-2.5 text-white">
        <CalendarClock size={16} />
        <h3 className="text-sm font-bold">Acara akan datang</h3>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <Inbox className="text-slate-300" size={28} />
          <p className="text-xs text-slate-500">Tiada acara dalam 30 hari akan datang.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => {
            const { day, month } = formatDayMonth(it.date);
            const Icon = it.kind === "ASSIGNMENT" ? ClipboardList : Calendar;
            const iconAccent =
              it.kind === "ASSIGNMENT" ? "text-ukm-orange" : "text-ukm-teal";
            return (
              <li key={it.id}>
                <Link
                  href={it.link}
                  className="flex items-start gap-3 px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-center leading-tight">
                    <div>
                      <p className="text-sm font-bold text-ukm-navy">{day}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">{month}</p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ukm-navy">{it.title}</p>
                      <Icon size={12} className={`mt-1 shrink-0 ${iconAccent}`} />
                    </div>
                    <p className="truncate text-[11px] text-slate-500">
                      {dayLabel(it.date)}
                      {it.time ? ` · ${it.time}` : ""}
                      {it.context ? ` · ${it.context}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
