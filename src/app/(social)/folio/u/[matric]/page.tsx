import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, GraduationCap, Hash } from "lucide-react";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/common/Avatar";
import { PostCard, type PostCardData } from "@/components/folio/PostCard";
import { FriendButton } from "@/components/folio/FriendButton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getFolioPostsByAuthor,
  getFolioProfile,
  getViewerRepostedParentIds,
} from "@/server/queries/folio";
import { getFriendshipStatus } from "@/server/queries/friends";

export const dynamic = "force-dynamic";

type Props = { params: { matric: string } };

export default async function FolioProfilePage({ params }: Props) {
  const session = await auth();
  const viewerId = session!.user.id;
  const matric = params.matric.toUpperCase();

  const profile = await getFolioProfile(matric);
  if (!profile) notFound();

  const [posts, friendStatus] = await Promise.all([
    getFolioPostsByAuthor(viewerId, profile.id, 100),
    getFriendshipStatus(viewerId, profile.id),
  ]);

  const parentIds = new Set<number>();
  for (const p of posts) {
    if (!p.isRepost) parentIds.add(p.id);
    if (p.parent) parentIds.add(p.parent.id);
  }
  const reposted = await getViewerRepostedParentIds(viewerId, [...parentIds]);

  const cards: PostCardData[] = posts.map((p) => ({
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
      <Link
        href="/folio"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-ukm-teal"
      >
        <ArrowLeft size={14} /> Kembali ke feed
      </Link>

      <header className="card-elevated overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-br from-ukm-teal via-cyan-500 to-ukm-orange" />
        <div className="-mt-10 px-5 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Avatar
              name={profile.name}
              avatarPath={profile.avatarPath}
              size="xl"
              ring
              className="border-4 border-white"
            />
            <div className="mt-12">
              <FriendButton
                otherUserId={profile.id}
                otherUserName={profile.name}
                status={friendStatus}
              />
            </div>
          </div>
          <div className="mt-3">
            <h1 className="text-xl font-bold text-ukm-navy">{profile.name}</h1>
            <p className="font-mono text-xs text-slate-500">
              @{profile.matricNum?.toLowerCase() ?? "—"}
            </p>
            {profile.bio && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {profile.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              {profile.faculty && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 font-semibold text-purple-700">
                  <Building2 size={12} /> {profile.faculty}
                </span>
              )}
              {profile.program && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">
                  <GraduationCap size={12} /> {profile.program}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-ukm-orange">
                <Hash size={12} /> {profile._count.folioPosts} pos
              </span>
            </div>
          </div>
        </div>
      </header>

      {cards.length === 0 ? (
        <EmptyState
          title="Belum ada pos"
          description={`${profile.name} belum berkongsi apa-apa di Folio Connect.`}
        />
      ) : (
        <div className="space-y-4">
          {cards.map((c) => {
            const parentKey = c.isRepost && c.parent ? c.parent.id : c.id;
            return (
              <PostCard
                key={c.id}
                post={c}
                currentUserId={viewerId}
                hasReposted={reposted.has(parentKey)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
