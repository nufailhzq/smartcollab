import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  FileText,
  History,
  Inbox,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { RecentAccessItem } from "@/server/queries/recent-access";

type Props = { items: RecentAccessItem[] };

const ICONS: Record<RecentAccessItem["type"], LucideIcon> = {
  COURSE: BookOpen,
  ASSIGNMENT: ClipboardList,
  GROUP: Users,
  CONTENT: FileText,
  SUBMISSION: FileText,
};

const ACCENTS: Record<RecentAccessItem["type"], string> = {
  COURSE: "bg-sky-50 text-ukm-teal",
  ASSIGNMENT: "bg-orange-50 text-ukm-orange",
  GROUP: "bg-purple-50 text-purple-600",
  CONTENT: "bg-emerald-50 text-emerald-600",
  SUBMISSION: "bg-rose-50 text-rose-600",
};

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "baru sekarang";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min yang lalu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} jam yang lalu`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} hari yang lalu`;
  return new Date(date).toLocaleDateString("ms-MY");
}

export function RecentAccessPanel({ items }: Props) {
  return (
    <section className="card overflow-hidden p-0">
      <header className="flex items-center gap-2 border-b border-slate-100 bg-ukm-orange px-3 py-2.5 text-white">
        <History size={16} />
        <h3 className="text-sm font-bold">Item yang diakses baru-baru ini</h3>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <Inbox className="text-slate-300" size={28} />
          <p className="text-xs text-slate-500">Belum ada item diakses lagi.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => {
            const Icon = ICONS[it.type];
            return (
              <li key={it.id}>
                <Link
                  href={it.link}
                  className="flex items-start gap-3 px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded ${ACCENTS[it.type]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ukm-navy">
                      {it.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {relativeTime(it.accessedAt)}
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
