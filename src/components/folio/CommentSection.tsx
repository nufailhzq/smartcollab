"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Send, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { addFolioComment, deleteFolioComment } from "@/server/actions/folio";
import { COMMENT_MAX_LENGTH } from "@/schemas/folio";

// Only image MIME types — videos are intentionally excluded for comments.
const ALLOWED_COMMENT_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_COMMENT_IMAGE_BYTES = 5 * 1024 * 1024;

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
  /** Public path to an attached image (gif/jpg/png/webp). Null = text-only. */
  imagePath: string | null;
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(
    null,
  );

  const canPost = viewer.role === "STUDENT" || viewer.role === "LECTURER";
  const remaining = COMMENT_MAX_LENGTH - text.length;

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!ALLOWED_COMMENT_IMAGE_TYPES.has(file.type)) {
      setError("Hanya imej (PNG/JPG/WEBP/GIF) dibenarkan — bukan video.");
      return;
    }
    if (file.size > MAX_COMMENT_IMAGE_BYTES) {
      setError("Saiz imej melebihi 5MB.");
      return;
    }
    setError(null);
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function clearImage() {
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = text.trim();
    if (!content && !image) return;
    if (pending) return;
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("postId", String(postId));
      fd.set("content", content);
      if (image) fd.set("image", image.file);
      const res = await addFolioComment(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setText("");
      clearImage();
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
                    {c.content && (
                      <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {c.content}
                      </p>
                    )}
                    {c.imagePath && (
                      <a
                        href={c.imagePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 block overflow-hidden rounded-lg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.imagePath}
                          alt=""
                          loading="lazy"
                          className="max-h-72 max-w-full rounded-lg object-cover"
                        />
                      </a>
                    )}
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
                placeholder={image ? "Tambah teks (pilihan)…" : "Tulis komen…"}
                maxLength={COMMENT_MAX_LENGTH + 20}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-20 text-sm outline-none transition focus:border-ukm-teal focus:bg-white focus:ring-4 focus:ring-sky-500/15"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                title="Lampirkan imej atau GIF"
                aria-label="Lampirkan imej atau GIF"
                className="absolute left-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-sky-100 hover:text-ukm-teal disabled:opacity-40"
              >
                <ImagePlus size={14} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onPickImage}
                className="hidden"
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
                  disabled={
                    pending ||
                    (text.trim().length === 0 && !image) ||
                    remaining < 0
                  }
                  className="grid h-7 w-7 place-items-center rounded-full bg-ukm-teal text-white shadow-soft transition hover:bg-cyan-600 disabled:opacity-40"
                  aria-label="Hantar komen"
                >
                  {pending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>
            </div>

            {image && (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt="Pratonton"
                  className="max-h-32 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-900/70 text-white shadow-soft hover:bg-ukm-red"
                  aria-label="Buang imej"
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {error && (
              <p className="mt-1 text-xs text-ukm-red">{error}</p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
