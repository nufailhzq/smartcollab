import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { searchStudents } from "@/server/queries/folio";

export const dynamic = "force-dynamic";

type Props = { searchParams: { q?: string } };

export default async function FolioSearchPage({ searchParams }: Props) {
  const q = (searchParams.q ?? "").trim();
  const hits = q ? await searchStudents(q, 60) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="card flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-ukm-teal">
          <Search size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ukm-navy">Cari Pelajar</h1>
          <p className="text-sm text-slate-500">
            {q ? (
              <>
                Hasil untuk <span className="font-semibold text-slate-700">&ldquo;{q}&rdquo;</span> ·{" "}
                {hits.length} pelajar
              </>
            ) : (
              "Cari pelajar mengikut nama, no. matrik, kursus, atau fakulti."
            )}
          </p>
        </div>
      </header>

      {q && hits.length === 0 && (
        <EmptyState
          title="Tiada pelajar dijumpai"
          description={`Tiada padanan untuk "${q}". Cuba kata kunci lain.`}
        />
      )}

      {hits.length > 0 && (
        <ul className="space-y-2">
          {hits.map((h) => (
            <li key={h.id}>
              <Link
                href={`/folio/u/${h.matricNum?.toLowerCase() ?? ""}`}
                className="card card-hover flex items-center gap-3 p-3"
              >
                <Avatar name={h.name} avatarPath={h.avatarPath} size="md" ring />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ukm-navy">{h.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    <span className="font-mono">@{h.matricNum?.toLowerCase()}</span>
                    {h.program ? ` · ${h.program}` : ""}
                    {h.faculty ? ` · ${h.faculty}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
