"use client";

import { useState } from "react";
import { FileText, Download, Eye, Users, Clock } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Modal } from "@/components/common/Modal";
import { formatDateTime } from "@/lib/utils";
import type { GroupSubmissions, GroupSubmissionEntry } from "@/server/queries/submissions";

// ─────────────────────────────────────────────────────────────────────────────
// Group Submissions — peer file visibility (Feature 2).
//
// GROUP-assignment submissions are propagated one row per member by the submit
// action, so every member already has a Submission row pointing at the shared
// file. This view simply surfaces each member's row: the file (clickable),
// who actually submitted it, and when. PDFs/images get an in-page preview modal
// so peers don't have to download to glance at what was handed in.
// ─────────────────────────────────────────────────────────────────────────────

/** Recover the original filename from a stored submission path for display. */
function displayName(p: string): string {
  const tail = p.split(/[\\/]/).pop() ?? p;
  const idx = tail.indexOf("__");
  const name = idx >= 0 ? tail.slice(idx + 2) : tail;
  // Stored paths URL-encode the original name; decode for display.
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

type PreviewKind = "pdf" | "image" | "none";

function previewKind(path: string): PreviewKind {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  return "none";
}

type Props = {
  data: GroupSubmissions;
  viewerId: number;
};

export function GroupSubmissionsView({ data, viewerId }: Props) {
  const [preview, setPreview] = useState<{ url: string; name: string; kind: PreviewKind } | null>(
    null,
  );

  const submittedCount = data.entries.filter((e) => e.filePath).length;

  return (
    <section className="card space-y-3">
      <header className="flex items-center gap-2">
        <Users className="text-ukm-teal" size={18} />
        <h2 className="text-base font-semibold">Penghantaran Kumpulan</h2>
        <span className="ml-auto text-xs text-slate-500">
          {data.groupName} · {submittedCount}/{data.entries.length} dihantar
        </span>
      </header>
      <p className="text-xs text-slate-500">
        Fail yang dihantar oleh mana-mana ahli kumpulan kelihatan kepada semua ahli.
      </p>

      <ul className="divide-y divide-slate-100">
        {data.entries.map((e) => (
          <GroupSubmissionRow
            key={e.memberId}
            entry={e}
            viewerId={viewerId}
            onPreview={(url, name, kind) => setPreview({ url, name, kind })}
          />
        ))}
      </ul>

      {preview && (
        <Modal
          open
          onClose={() => setPreview(null)}
          title={preview.name}
          className="max-w-4xl"
        >
          {preview.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.name}
              className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain"
            />
          ) : (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-[70vh] w-full rounded-lg border border-slate-200"
            />
          )}
          <div className="mt-3 text-right">
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Download size={14} /> Muat turun
            </a>
          </div>
        </Modal>
      )}
    </section>
  );
}

function GroupSubmissionRow({
  entry: e,
  viewerId,
  onPreview,
}: {
  entry: GroupSubmissionEntry;
  viewerId: number;
  onPreview: (url: string, name: string, kind: PreviewKind) => void;
}) {
  const isMe = e.memberId === viewerId;
  const kind = e.filePath ? previewKind(e.filePath) : "none";

  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={e.memberName} avatarPath={e.memberAvatar} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {isMe ? "Anda" : e.memberName}
          {e.memberMatric && (
            <span className="ml-1.5 font-mono text-[10px] text-slate-400">{e.memberMatric}</span>
          )}
        </p>
        {e.filePath ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 text-ukm-teal">
              <FileText size={11} className="shrink-0" />
              <span className="max-w-[180px] truncate">{displayName(e.filePath)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> {formatDateTime(e.submittedAt)}
            </span>
            {/* When someone else submitted on this member's behalf, say so. */}
            {e.submittedById !== null && e.submittedById !== e.memberId && (
              <span className="italic">
                (oleh {e.submittedById === viewerId ? "anda" : e.submittedByName})
              </span>
            )}
          </div>
        ) : (
          <p className="mt-0.5 text-[11px] italic text-slate-400">Belum dihantar</p>
        )}
      </div>

      {e.filePath && (
        <div className="flex shrink-0 items-center gap-1">
          {kind !== "none" && (
            <button
              type="button"
              onClick={() => onPreview(e.filePath!, displayName(e.filePath!), kind)}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
              aria-label="Pratonton"
              title="Pratonton"
            >
              <Eye size={15} />
            </button>
          )}
          <a
            href={e.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
            aria-label="Muat turun"
            title="Muat turun"
          >
            <Download size={15} />
          </a>
        </div>
      )}
    </li>
  );
}
