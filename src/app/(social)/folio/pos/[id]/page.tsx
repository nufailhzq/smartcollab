import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostCard, type PostCardData } from "@/components/folio/PostCard";
import type { CommentRow } from "@/components/folio/CommentSection";
import {
  getCommentsForPost,
  getFolioPostById,
  getViewerRepostedParentIds,
} from "@/server/queries/folio";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function FolioPostDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const session = await auth();
  const viewerId = session!.user.id;

  const [p, viewer] = await Promise.all([
    getFolioPostById(viewerId, id),
    prisma.user.findUniqueOrThrow({
      where: { id: viewerId },
      select: { id: true, name: true, matricNum: true, avatarPath: true, role: true },
    }),
  ]);
  if (!p) notFound();

  const parentKey = p.isRepost && p.parent ? p.parent.id : p.id;
  const [reposted, comments] = await Promise.all([
    getViewerRepostedParentIds(viewerId, [parentKey]),
    getCommentsForPost(p.id),
  ]);

  const card: PostCardData = {
    id: p.id,
    content: p.content,
    visibility: p.visibility,
    isRepost: p.isRepost,
    archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    author: {
      id: p.author.id,
      name: p.author.name,
      matricNum: p.author.matricNum,
      avatarPath: p.author.avatarPath?.replace("/uploads/avatars", "/api/uploads/avatars") ?? null,
      faculty: p.author.faculty,
      program: p.author.program,
    },
    images: p.images.map((i) => ({ 
      id: i.id, 
      imagePath: i.imagePath?.replace("/uploads/posts", "/api/uploads/posts") ?? null, 
      position: i.position 
    })),
    mentions: p.mentions.map((m) => ({
      id: m.id,
      matricNum: m.matricNum,
      mentionedUser: {
        id: m.mentionedUser.id,
        name: m.mentionedUser.name,
        matricNum: m.mentionedUser.matricNum,
      },
    })),
    reactions: p.reactions.map((r) => ({ id: r.id, emoji: r.emoji, userId: r.userId })),
    parent: p.parent
      ? {
          id: p.parent.id,
          content: p.parent.content,
          visibility: p.parent.visibility,
          createdAt: p.parent.createdAt.toISOString(),
          author: {
            id: p.parent.author.id,
            name: p.parent.author.name,
            matricNum: p.parent.author.matricNum,
            avatarPath: p.parent.author.avatarPath?.replace("/uploads/avatars", "/api/uploads/avatars") ?? null,
            faculty: p.parent.author.faculty,
            program: p.parent.author.program,
          },
          images: p.parent.images.map((i) => ({
            id: i.id,
            imagePath: i.imagePath?.replace("/uploads/posts", "/api/uploads/posts") ?? null,
            position: i.position,
          })),
          mentions: p.parent.mentions.map((m) => ({
            id: m.id,
            matricNum: m.matricNum,
            mentionedUser: {
              id: m.mentionedUser.id,
              name: m.mentionedUser.name,
              matricNum: m.mentionedUser.matricNum,
            },
          })),
          reactions: p.parent.reactions.map((r) => ({
            id: r.id,
            emoji: r.emoji,
            userId: r.userId,
          })),
          repostCount: p.parent._count.reposts,
          commentCount: p.parent._count.comments,
        }
      : null,
    repostCount: p._count.reposts,
    commentCount: p._count.comments,
  };

  const commentRows: CommentRow[] = comments.map((c) => ({
    id: c.id,
    content: c.content,
    imagePath: c.imagePath ? c.imagePath.replace("/uploads/posts", "/api/uploads/posts") : null,
    createdAt: c.createdAt.toISOString(),
    author: {
      id: c.author.id,
      name: c.author.name,
      matricNum: c.author.matricNum,
      avatarPath: c.author.avatarPath?.replace("/uploads/avatars", "/api/uploads/avatars") ?? null,
      role: c.author.role,
    },
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/folio"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-ukm-teal"
      >
        <ArrowLeft size={14} /> Kembali ke feed
      </Link>

      <PostCard
        post={card}
        currentUserId={viewerId}
        hasReposted={reposted.has(parentKey)}
        inlineComments={commentRows}
        viewer={{
          id: viewer.id,
          name: viewer.name,
          matricNum: viewer.matricNum,
          avatarPath: viewer.avatarPath?.replace("/uploads/avatars", "/api/uploads/avatars") ?? null,
          role: viewer.role,
        }}
      />
    </div>
  );
}