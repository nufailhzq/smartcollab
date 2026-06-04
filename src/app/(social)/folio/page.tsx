import { Hash, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFolioFeed, getViewerRepostedParentIds } from "@/server/queries/folio";
import { ComposePost } from "@/components/folio/ComposePost";
import { PostCard, type PostCardData } from "@/components/folio/PostCard";
import { EmptyState } from "@/components/common/EmptyState";

export const dynamic = "force-dynamic";

export default async function FolioFeedPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, feed] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, matricNum: true, avatarPath: true, role: true },
    }),
    getFolioFeed(userId, 60),
  ]);

  // For repost-state badges: collect the parent IDs the viewer might have reposted
  // (which are either originals shown in feed, or parents of rows we're showing).
  const parentIds = new Set<number>();
  for (const p of feed) {
    if (!p.isRepost) parentIds.add(p.id);
    if (p.parent) parentIds.add(p.parent.id);
  }
  const reposted = await getViewerRepostedParentIds(userId, [...parentIds]);

  const cards: PostCardData[] = feed.map((p) => ({
    id: p.id,
    content: p.content,
    visibility: p.visibility,
    isRepost: p.isRepost,
    createdAt: p.createdAt.toISOString(),
    author: {
      id: p.author.id,
      name: p.author.name,
      matricNum: p.author.matricNum,
      avatarPath: p.author.avatarPath,
      faculty: p.author.faculty,
      program: p.author.program,
    },
    images: p.images.map((i) => ({ id: i.id, imagePath: i.imagePath, position: i.position })),
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
            avatarPath: p.parent.author.avatarPath,
            faculty: p.parent.author.faculty,
            program: p.parent.author.program,
          },
          images: p.parent.images.map((i) => ({
            id: i.id,
            imagePath: i.imagePath,
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
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl bg-gradient-to-br from-ukm-teal via-cyan-500 to-ukm-orange px-6 py-7 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Hash size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/80">UKMFolio</p>
            <h1 className="text-2xl font-bold text-white">Folio Connect</h1>
          </div>
        </div>
        <p className="mt-2 max-w-xl text-sm text-white/90">
          Suara komuniti pelajar UKM. Kongsi nota, soal pendapat, repost rakan, dan tag mereka
          dengan no. matrik.
        </p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
          <Sparkles size={12} /> Beta untuk pelajar &amp; pensyarah
        </p>
      </header>

      {user.role === "STUDENT" || user.role === "LECTURER" ? (
        <ComposePost
          userId={user.id}
          userName={user.name}
          userMatric={user.matricNum}
          avatarPath={user.avatarPath}
        />
      ) : (
        <div className="card text-sm text-slate-500">
          Folio Connect terbuka kepada pelajar dan pensyarah. Admin boleh membaca tetapi tidak
          menghantar pos.
        </div>
      )}

      {cards.length === 0 ? (
        <EmptyState
          title="Tiada pos lagi"
          description="Jadilah yang pertama menghantar sesuatu ke Folio Connect."
        />
      ) : (
        <div className="space-y-4">
          {cards.map((c) => {
            const parentKey = c.isRepost && c.parent ? c.parent.id : c.id;
            return (
              <PostCard
                key={c.id}
                post={c}
                currentUserId={userId}
                hasReposted={reposted.has(parentKey)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
