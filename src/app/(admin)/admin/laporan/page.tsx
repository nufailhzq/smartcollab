import { Flag } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPendingFolioReports } from "@/server/queries/folio-reports";
import { EmptyState } from "@/components/common/EmptyState";
import { ReportActions } from "./report-actions";
import { formatDateTime } from "@/lib/utils";

export default async function AdminReportsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return <EmptyState title="Hanya admin dibenarkan." />;
  }

  const reports = await getPendingFolioReports();

  // Group reports by post so multiple reports against the same post collapse.
  type Grouped = (typeof reports)[number]["post"] & {
    reports: typeof reports;
  };
  const byPost = new Map<number, Grouped>();
  for (const r of reports) {
    const existing = byPost.get(r.postId);
    if (existing) {
      existing.reports.push(r);
    } else {
      byPost.set(r.postId, { ...r.post, reports: [r] });
    }
  }
  const groups = [...byPost.values()];

  return (
    <div className="space-y-5">
      <div className="gradient-hero-orange relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Flag size={24} /> Laporan Pos Folio
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Triage laporan pengguna. Padam pos yang melanggar dasar atau tolak
            laporan yang tidak sah.
          </p>
        </div>
      </div>

      <div className="card flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50">
          <Flag className="text-ukm-orange" size={22} />
        </div>
        <div>
          <p className="text-3xl font-bold text-ukm-orange">{groups.length}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Pos berstatus tertunggak
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="Tiada laporan tertunggak" />
      ) : (
        <div className="space-y-4">
          {groups.map((post) => (
            <article
              key={post.id}
              className="card-elevated space-y-4 animate-fade-in"
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pos oleh
                  </p>
                  <p className="text-base font-bold text-ukm-navy">
                    {post.author.name}{" "}
                    <span className="font-mono text-xs font-normal text-slate-500">
                      @{post.author.matricNum?.toLowerCase() ?? "—"}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Dipos {formatDateTime(post.createdAt)} ·{" "}
                    {post._count.reactions} reaksi · {post._count.comments} komen
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  <Flag size={11} /> {post.reports.length} laporan
                </span>
              </header>

              {/* Post content preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {post.content ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {post.content}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-400">(tanpa teks)</p>
                )}
                {post.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.images.slice(0, 4).map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={img.imagePath}
                        alt=""
                        className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Reports stack */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sebab laporan ({post.reports.length})
                </p>
                <ul className="space-y-2">
                  {post.reports.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-amber-900">
                          {r.reporter.name}
                          <span className="ml-1.5 font-mono text-[10px] font-normal text-amber-700/70">
                            @{r.reporter.matricNum?.toLowerCase() ?? "—"}
                          </span>
                          <span className="ml-2 text-[10px] font-normal text-amber-700/60">
                            · {formatDateTime(r.createdAt)}
                          </span>
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">
                          {r.reason}
                        </p>
                      </div>
                      <ReportActions
                        kind="dismiss-one"
                        reportId={r.id}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                <ReportActions
                  kind="delete"
                  postId={post.id}
                  authorName={post.author.name}
                />
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
