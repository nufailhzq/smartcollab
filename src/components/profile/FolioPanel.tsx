"use client";

import { useState, type ReactNode } from "react";
import { Archive, ChevronDown, Hash } from "lucide-react";

/**
 * Collapsible panel that hides the user's Folio posts / reposts behind a
 * single click. Three tabs: All posts · Reposts · Archive — each rendered as
 * a server-side `<PostCard>` list passed in by the parent profile page.
 */
export function FolioPanel({
  postsCount,
  repostsCount,
  archivedCount,
  postsContent,
  repostsContent,
  archivedContent,
  defaultOpen = false,
}: {
  postsCount: number;
  repostsCount: number;
  archivedCount: number;
  postsContent: ReactNode;
  repostsContent: ReactNode;
  archivedContent: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<"posts" | "reposts" | "archive">("posts");

  return (
    <section className="card-elevated">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
            <Hash size={18} />
          </div>
          <div>
            <p className="text-base font-bold text-ukm-navy">
              Folio Connect Saya
            </p>
            <p className="text-xs text-slate-500">
              {postsCount} pos · {repostsCount} repost
              {archivedCount > 0 && ` · ${archivedCount} arkib`}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={
            open
              ? "text-slate-500 transition-transform duration-200 rotate-180"
              : "text-slate-500 transition-transform duration-200"
          }
        />
      </button>

      {open && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div className="flex gap-2 border-b border-slate-200">
            <TabBtn
              active={tab === "posts"}
              onClick={() => setTab("posts")}
              count={postsCount}
              label="Pos"
            />
            <TabBtn
              active={tab === "reposts"}
              onClick={() => setTab("reposts")}
              count={repostsCount}
              label="Repost"
            />
            <TabBtn
              active={tab === "archive"}
              onClick={() => setTab("archive")}
              count={archivedCount}
              label="Arkib"
              icon={<Archive size={11} />}
            />
          </div>

          <div className="space-y-3">
            {tab === "posts" && postsContent}
            {tab === "reposts" && repostsContent}
            {tab === "archive" && archivedContent}
          </div>
        </div>
      )}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  count,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "-mb-px flex items-center gap-1.5 border-b-2 border-purple-600 px-3 py-2 text-sm font-bold text-purple-700"
          : "-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-slate-500 hover:text-ukm-navy"
      }
    >
      {icon}
      {label}
      <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
        {count}
      </span>
    </button>
  );
}
