import Link from "next/link";
import { Megaphone, Pin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ActiveBulletin } from "@/server/queries/bulletins";

type Props = { bulletins: ActiveBulletin[] };

export function BulletinBoard({ bulletins }: Props) {
  if (bulletins.length === 0) return null;

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-ukm-orange text-white">
          <Megaphone size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ukm-navy">Buletin Pengajaran-UKM</h2>
          <p className="text-xs text-slate-500">Pengumuman rasmi daripada pentadbir sistem.</p>
        </div>
      </header>

      <ul className="space-y-4">
        {bulletins.map((b) => (
          <li
            key={b.id}
            className="card overflow-hidden border-l-4 border-l-ukm-orange p-0"
          >
            <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              {b.isPinned && (
                <Pin size={14} className="text-ukm-orange" aria-label="Disematkan" />
              )}
              <h3 className="text-sm font-bold uppercase tracking-wide text-ukm-navy">
                {b.title}
              </h3>
              <span className="ml-auto text-[11px] text-slate-500">
                {formatDate(b.createdAt)} · {b.createdBy.name}
              </span>
            </header>

            <div className="space-y-3 px-4 py-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {b.body}
              </p>

              {b.imagePath && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.imagePath}
                    alt={b.title}
                    className="h-auto w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {b.linkUrl && (
                <Link
                  href={b.linkUrl}
                  target={b.linkUrl.startsWith("http") ? "_blank" : undefined}
                  rel={b.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ukm-teal hover:underline"
                >
                  {b.linkLabel ?? "Buka pautan"} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
