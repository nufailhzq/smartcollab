import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

type Props = {
  code: string;
  title: string;
  lecturerName?: string | null;
  semester?: string | null;
  creditHours?: number | null;
  href: string;
  ctaLabel?: string;
};

export function CourseCard({
  code,
  title,
  lecturerName,
  semester,
  creditHours,
  href,
  ctaLabel = "Lihat Kursus",
}: Props) {
  return (
    <article className="card flex h-full flex-col">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
        <span className="rounded-md bg-orange-100 px-2 py-1 font-mono font-semibold text-ukm-orange">
          {code}
        </span>
        {semester && <span>{semester}</span>}
      </div>
      <div className="mt-3 flex flex-1 items-start gap-3">
        <BookOpen className="mt-0.5 shrink-0 text-ukm-teal" size={20} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-ukm-navy">{title}</h3>
          {lecturerName && <p className="mt-1 text-xs text-slate-500">{lecturerName}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {creditHours ? `${creditHours} jam kredit` : ""}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ukm-teal hover:bg-sky-50"
        >
          {ctaLabel} <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
