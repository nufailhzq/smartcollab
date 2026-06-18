import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AvatarUploader } from "@/components/common/AvatarUploader";
import { MuteToggle } from "@/components/profile/MuteToggle";
import { ThemePicker } from "@/components/profile/ThemePicker";
import { FolioPanel } from "@/components/profile/FolioPanel";
import { PostCard, type PostCardData } from "@/components/folio/PostCard";
import { getFolioPostsByAuthor } from "@/server/queries/folio";
import {
  Building2,
  Calendar,
  GraduationCap,
  Hash,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default async function StudentProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, enrollmentsCount, groupCount, submissionsCount, allPosts] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.classEnrollment.count({ where: { studentId: userId } }),
      prisma.groupMember.count({ where: { studentId: userId } }),
      prisma.submission.count({ where: { studentId: userId } }),
      // Pull every post + repost (including archives) for the owner only.
      getFolioPostsByAuthor(userId, userId, 200, true),
    ]);

  const fields = [
    { label: "Nama", value: user.name, Icon: GraduationCap },
    { label: "No. Matrik", value: user.matricNum ?? "—", Icon: Hash },
    { label: "Emel", value: user.email ?? "—", Icon: Mail },
    { label: "Fakulti", value: user.faculty ?? "—", Icon: Building2 },
    { label: "Peranan", value: "Pelajar", Icon: ShieldCheck },
    { label: "Daftar", value: formatDate(user.createdAt), Icon: Calendar },
  ];

  // Split posts into the three tabs for the FolioPanel.
  const originalLive = allPosts.filter((p) => !p.isRepost && !p.archivedAt);
  const reposted = allPosts.filter((p) => p.isRepost && !p.archivedAt);
  const archived = allPosts.filter((p) => p.archivedAt);

  const toCard = (p: (typeof allPosts)[number]): PostCardData => ({
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
    images: p.images.map((i) => ({
      id: i.id,
      imagePath: i.imagePath,
      position: i.position,
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
    reactions: p.reactions.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      userId: r.userId,
    })),
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
  });

  const renderList = (items: PostCardData[]) =>
    items.length === 0 ? (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm italic text-slate-400">
        Tiada pos di tab ini.
      </p>
    ) : (
      <div className="space-y-3">
        {items.map((card) => (
          <PostCard key={card.id} post={card} currentUserId={userId} />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ukm-navy">Profil Saya</h1>
        <p className="text-sm text-slate-500">Maklumat akaun anda di SmartCollab.</p>
      </div>

      <article className="card-elevated">
        <AvatarUploader
          name={user.name}
          initialAvatarPath={user.avatarPath}
          badge={
            <div>
              <h2 className="text-xl font-bold text-ukm-navy">{user.name}</h2>
              <p className="text-sm text-slate-500">
                <span className="badge-student mr-2">Pelajar</span>
                {user.matricNum} · {user.faculty}
              </p>
            </div>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <Icon className="mt-0.5 text-ukm-teal" size={16} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-ukm-navy">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-ukm-teal">{enrollmentsCount}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Kursus</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{groupCount}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Kumpulan</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-ukm-orange">{submissionsCount}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Penghantaran</p>
        </div>
      </div>

      <ThemePicker initial={user.theme} />

      <MuteToggle initial={user.notificationsMuted} />

      <FolioPanel
        postsCount={originalLive.length}
        repostsCount={reposted.length}
        archivedCount={archived.length}
        postsContent={renderList(originalLive.map(toCard))}
        repostsContent={renderList(reposted.map(toCard))}
        archivedContent={renderList(archived.map(toCard))}
      />

      <form action="/logout" method="POST">
        <button type="submit" className="btn-danger">
          <LogOut size={16} /> Log Keluar
        </button>
      </form>
    </div>
  );
}
