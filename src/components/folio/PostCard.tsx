"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Globe2,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Trash2,
  Users,
  UsersRound,
} from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { MentionText } from "./MentionText";
import { ReactionsBar } from "./ReactionsBar";
import { CommentSection, type CommentRow } from "./CommentSection";
import { deleteFolioPost, toggleRepost } from "@/server/actions/folio";

type Author = {
  id: number;
  name: string;
  matricNum: string | null;
  avatarPath: string | null;
  faculty: string | null;
  program: string | null;
};

type Image = { id: number; imagePath: string; position: number };

type Mention = {
  id: number;
  matricNum: string;
  mentionedUser: { id: number; name: string; matricNum: string | null };
};

type ReactionRow = { id: number; emoji: string; userId: number };

export type PostCardData = {
  id: number;
  content: string;
  visibility: "PUBLIC" | "FACULTY" | "FRIENDS";
  isRepost: boolean;
  createdAt: string;
  author: Author;
  images: Image[];
  mentions: Mention[];
  reactions: ReactionRow[];
  parent: {
    id: number;
    content: string;
    visibility: "PUBLIC" | "FACULTY" | "FRIENDS";
    createdAt: string;
    author: Author;
    images: Image[];
    mentions: Mention[];
    reactions: ReactionRow[];
    repostCount: number;
    commentCount: number;
  } | null;
  repostCount: number;
  commentCount: number;
};

type Props = {
  post: PostCardData;
  currentUserId: number;
  /** True if the viewer has already reposted the post (or its parent). */
  hasReposted?: boolean;
  /** Render the comments section inline (detail page passes the loaded comments). */
  inlineComments?: CommentRow[];
  viewer?: {
    id: number;
    name: string;
    matricNum: string | null;
    avatarPath: string | null;
    role: "STUDENT" | "LECTURER" | "ADMIN";
  };
};

const VIS_META: Record<
  PostCardData["visibility"],
  { Icon: typeof Globe2; label: string; cls: string }
> = {
  PUBLIC: { Icon: Globe2, label: "Awam", cls: "text-slate-500" },
  FACULTY: { Icon: Users, label: "Fakulti", cls: "text-purple-500" },
  FRIENDS: { Icon: UsersRound, label: "Rakan", cls: "text-emerald-500" },
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
  return new Date(iso).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PostCard({
  post,
  currentUserId,
  hasReposted = false,
  inlineComments,
  viewer,
}: Props) {
  // If this row is a repost, render the parent post with a "Dikongsi oleh X" banner.
  const display = post.isRepost && post.parent ? post.parent : post;
  const reposter = post.isRepost && post.parent ? post.author : null;
  const isOwn = display.author.id === currentUserId;
  const canRepost = !isOwn && display.author.id !== currentUserId;
  const Vis = VIS_META[display.visibility];
  const commentCount = post.isRepost && post.parent ? post.parent.commentCount : post.commentCount;
  const reactions = post.isRepost && post.parent ? post.parent.reactions : post.reactions;

  const resolvedMatrics = new Set(
    display.mentions
      .map((m) => m.matricNum?.toUpperCase())
      .filter((v): v is string => !!v),
  );

  const [isPending, startTransition] = useTransition();
  const [openMenu, setOpenMenu] = useState(false);
  const [localReposted, setLocalReposted] = useState(hasReposted);
  const [localRepostCount, setLocalRepostCount] = useState(display.id === post.id ? post.repostCount : 0);

  function onToggleRepost() {
    startTransition(async () => {
      const res = await toggleRepost({ postId: display.id });
      if (res.ok) {
        setLocalReposted(res.data.reposted);
        setLocalRepostCount((c) => Math.max(0, c + (res.data.reposted ? 1 : -1)));
      } else {
        alert(res.error);
      }
    });
  }

  function onDelete() {
    if (!confirm("Padam pos ini?")) return;
    startTransition(async () => {
      const res = await deleteFolioPost({ postId: post.id });
      if (!res.ok) alert(res.error);
    });
  }

  return (
    <article className="card group relative animate-fade-in p-4 sm:p-5">
      {reposter && (
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <Repeat2 size={14} className="text-emerald-500" />
          <span>
            <Link
              href={`/folio/u/${reposter.matricNum?.toLowerCase() ?? ""}`}
              className="font-semibold text-slate-700 hover:underline"
            >
              {reposter.name}
            </Link>{" "}
            berkongsi pos ini
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/folio/u/${display.author.matricNum?.toLowerCase() ?? ""}`}
          className="shrink-0"
        >
          <Avatar
            name={display.author.name}
            avatarPath={display.author.avatarPath}
            size="md"
            ring
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Link
                  href={`/folio/u/${display.author.matricNum?.toLowerCase() ?? ""}`}
                  className="truncate text-sm font-bold text-ukm-navy hover:underline"
                >
                  {display.author.name}
                </Link>
                <span className="font-mono text-xs text-slate-400">
                  @{display.author.matricNum?.toLowerCase() ?? "—"}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">{timeAgo(display.createdAt)}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className={`inline-flex items-center gap-1 text-xs ${Vis.cls}`}>
                  <Vis.Icon size={12} /> {Vis.label}
                </span>
              </div>
              {(display.author.program || display.author.faculty) && (
                <p className="truncate text-[11px] text-slate-400">
                  {display.author.program ?? "—"}
                  {display.author.program && display.author.faculty ? " · " : ""}
                  {display.author.faculty ?? ""}
                </p>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Menu pos"
                onClick={() => setOpenMenu((v) => !v)}
              >
                <MoreHorizontal size={16} />
              </button>
              {openMenu && (
                <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lift">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(false);
                      onDelete();
                    }}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ukm-red hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    {isOwn || (reposter && reposter.id === currentUserId)
                      ? "Padam pos"
                      : "Padam pos ini"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {display.content && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              <MentionText content={display.content} resolvedMatrics={resolvedMatrics} />
            </p>
          )}

          {display.images.length > 0 && (
            <div
              className={`mt-3 grid gap-1.5 overflow-hidden rounded-xl border border-slate-200 ${
                display.images.length === 1
                  ? "grid-cols-1"
                  : display.images.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
              }`}
            >
              {display.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.imagePath}
                  alt=""
                  loading="lazy"
                  className={`h-full w-full object-cover ${
                    display.images.length === 3 && i === 0 ? "row-span-2" : ""
                  }`}
                  style={{ maxHeight: display.images.length === 1 ? "420px" : "260px" }}
                />
              ))}
            </div>
          )}

          <div className="mt-3 space-y-2">
            <ReactionsBar
              postId={display.id}
              reactions={reactions}
              viewerId={currentUserId}
            />

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <Link
                href={`/folio/pos/${display.id}`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-sky-50 hover:text-ukm-teal"
              >
                <MessageCircle size={14} />
                Komen
                {commentCount > 0 && (
                  <span className="ml-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-ukm-teal">
                    {commentCount}
                  </span>
                )}
              </Link>

              {canRepost && (
                <button
                  type="button"
                  onClick={onToggleRepost}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-emerald-50 ${
                    localReposted ? "text-emerald-600" : "hover:text-emerald-600"
                  }`}
                  aria-pressed={localReposted}
                >
                  <Repeat2 size={14} />
                  {localReposted ? "Dikongsi" : "Repost"}
                  {localRepostCount > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {localRepostCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {inlineComments && viewer && (
              <CommentSection
                postId={display.id}
                postAuthorId={display.author.id}
                comments={inlineComments}
                viewer={viewer}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
