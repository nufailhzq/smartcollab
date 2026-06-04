"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { addFolioComment, deleteFolioComment } from "@/server/actions/folio";
import { COMMENT_MAX_LENGTH } from "@/schemas/folio";

type CommentAuthor = {
  id: number;
  name: string;
  matricNum: string | null;
  avatarPath: string | null;
  role: "STUDENT" | "LECTURER" | "ADMIN";
};

export type CommentRow = {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
};

type Props = {
  postId: number;
  postAuthorId: number;
  comments: CommentRow[];
  viewer: {
    id: number;
    name: string;
    matricNum: string | null;
    avatarPath: string | null;
    role: "STUDENT" | "LECTURER" | "ADMIN";
  };
  /** When true, hides the input form (used for legacy / repost rows on the feed). */
  collapsed?: boolean;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}h`;
  return new Date(iso).toLocaleDateString("ms-MY", { day: "2-digit", month: "short" });
}

export function CommentSection({
  postId,
  postAuthorId,
  comments,
  viewer,
  collapsed = false,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canPost = viewer.role === "STUDENT" || viewer.role === "LECTURER";
  const remaining = COMMENT_MAX_LENGTH - text.length;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = text.trim();
    if (!content || pending) return;
    startTransition(async () => {
      setError(null);
      const res = await addFolioComment({ postId, content });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setText("");
      router.refresh();
    });
  }

  function onDelete(commentId: number) {
    if (!confirm("Padam komen ini?")) return;
    startTransition(async () => {
      const res = await deleteFolioComment({ commentId });
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mt-3 border-t border-slate-100 pt-3">
      {comments.length === 0 ? (
        <p className="text-xs text-slate-400">
          Belum ada komen. {canPost && "Jadilah yang pertama."}
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const canDelete =
              c.author.id === viewer.id ||
              postAuthorId === viewer.id ||
              viewer.role === "ADMIN";
            return (
              <li key={c.id} className="flex gap-2">
                <Link
                  href={`/folio/u/${c.author.matricNum?.toLowerCase() ?? ""}`}
                  className="shrink-0"
                >
                  <Avatar
                    name={c.author.name}
                    avatarPath={c.author.avatarPath}
                    size="sm"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="group/comment inline-block max-w-full rounded-2xl rounded-tl-md bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Link
                        href={`/folio/u/${c.author.matricNum?.toLowerCase() ?? ""}`}
                        className="font-semibold text-ukm-navy hover:underline"
                      >
                        {c.author.name}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">
                        @{c.author.matricNum?.toLowerCase() ?? "—"}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {c.content}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{timeAgo(c.createdAt)}</span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="inline-flex items-center gap-0.5 text-slate-400 transition hover:text-ukm-red"
                        disabled={pending}
                      >
                        <Trash2 size={11} /> Padam
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!collapsed && canPost && (
        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <Avatar
            name={viewer.name}
            avatarPath={viewer.avatarPath}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tulis komen…"
                maxLength={COMMENT_MAX_LENGTH + 20}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-3 pr-20 text-sm outline-none transition focus:border-ukm-teal focus:bg-white focus:ring-4 focus:ring-sky-500/15"
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-2">
                <span
                  className={`text-[10px] tabular-nums ${
                    remaining < 0
                      ? "font-semibold text-ukm-red"
                      : remaining < 40
                        ? "text-amber-600"
                        : "text-slate-400"
                  }`}
                >
                  {remaining}
                </span>
                <button
                  type="submit"
                  disabled={pending || text.trim().length === 0 || remaining < 0}
                  className="grid h-7 w-7 place-items-center rounded-full bg-ukm-teal text-white shadow-soft transition hover:bg-cyan-600 disabled:opacity-40"
                  aria-label="Hantar komen"
                >
                  {pending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-1 text-xs text-ukm-red">{error}</p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
