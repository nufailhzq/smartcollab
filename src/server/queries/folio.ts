import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Build the visibility filter for the current viewer. A post is shown when:
 *  - it's PUBLIC, OR
 *  - it's FACULTY and viewer.faculty === author.faculty, OR
 *  - it's FRIENDS and viewer is in an ACCEPTED friendship with author,
 *  - or viewer authored it.
 */
async function buildVisibilityWhere(viewerId: number): Promise<Prisma.FolioPostWhereInput> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { faculty: true },
  });
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: viewerId }, { receiverId: viewerId }],
    },
    select: { senderId: true, receiverId: true },
  });
  const friendIds = friendships.map((f) =>
    f.senderId === viewerId ? f.receiverId : f.senderId,
  );

  return {
    OR: [
      { authorId: viewerId },
      { visibility: "PUBLIC" },
      viewer?.faculty
        ? { visibility: "FACULTY", author: { faculty: viewer.faculty } }
        : { id: -1 }, // never matches when viewer has no faculty
      friendIds.length > 0
        ? { visibility: "FRIENDS", authorId: { in: friendIds } }
        : { id: -1 },
    ],
  };
}

const POST_AUTHOR_SELECT = {
  id: true,
  name: true,
  matricNum: true,
  avatarPath: true,
  faculty: true,
  program: true,
  role: true,
} as const;

const POST_INCLUDE = {
  author: { select: POST_AUTHOR_SELECT },
  images: { orderBy: { position: "asc" } },
  mentions: {
    include: {
      mentionedUser: {
        select: { id: true, name: true, matricNum: true, avatarPath: true },
      },
    },
  },
  reactions: {
    select: { id: true, emoji: true, userId: true },
  },
  parent: {
    include: {
      author: { select: POST_AUTHOR_SELECT },
      images: { orderBy: { position: "asc" } },
      mentions: {
        include: {
          mentionedUser: {
            select: { id: true, name: true, matricNum: true, avatarPath: true },
          },
        },
      },
      reactions: {
        select: { id: true, emoji: true, userId: true },
      },
      _count: { select: { reposts: true, comments: true } },
    },
  },
  _count: { select: { reposts: true, comments: true } },
} satisfies Prisma.FolioPostInclude;

export async function getFolioFeed(viewerId: number, take = 50) {
  const visibility = await buildVisibilityWhere(viewerId);
  return prisma.folioPost.findMany({
    where: {
      AND: [
        visibility,
        { archivedAt: null },
        // Hide reposts of archived parents too.
        { OR: [{ parentId: null }, { parent: { archivedAt: null } }] },
      ],
    },
    include: POST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * Posts authored by `authorId` that `viewerId` can see.
 * - When `includeArchived` is false (default) → hides archived posts.
 * - When `includeArchived` is true (owner viewing their own archive) → shows
 *   archived posts too. Only honored when viewer === author for safety.
 */
export async function getFolioPostsByAuthor(
  viewerId: number,
  authorId: number,
  take = 50,
  includeArchived = false,
) {
  const visibility = await buildVisibilityWhere(viewerId);
  const archivedFilter =
    includeArchived && viewerId === authorId ? {} : { archivedAt: null };
  return prisma.folioPost.findMany({
    where: { AND: [visibility, { authorId }, archivedFilter] },
    include: POST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getFolioPostById(viewerId: number, postId: number) {
  const visibility = await buildVisibilityWhere(viewerId);
  return prisma.folioPost.findFirst({
    where: { AND: [visibility, { id: postId }] },
    include: POST_INCLUDE,
  });
}

export async function hasRepostedByViewer(viewerId: number, parentId: number) {
  const existing = await prisma.folioPost.findFirst({
    where: { authorId: viewerId, parentId, isRepost: true },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * Return the set of parent post IDs the viewer has already reposted, scoped
 * to the parent IDs we care about. Lets the feed badge "Telah dikongsi".
 */
export async function getViewerRepostedParentIds(
  viewerId: number,
  parentIds: number[],
): Promise<Set<number>> {
  if (parentIds.length === 0) return new Set();
  const rows = await prisma.folioPost.findMany({
    where: {
      authorId: viewerId,
      isRepost: true,
      parentId: { in: parentIds },
    },
    select: { parentId: true },
  });
  return new Set(rows.map((r) => r.parentId).filter((v): v is number => v !== null));
}

export async function getFolioProfile(matricNum: string) {
  return prisma.user.findUnique({
    where: { matricNum },
    select: {
      id: true,
      name: true,
      matricNum: true,
      faculty: true,
      program: true,
      bio: true,
      avatarPath: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          folioPosts: true,
        },
      },
    },
  });
}

/**
 * Global search across STUDENTS and LECTURERS by name OR matric OR program
 * OR faculty. Admins are excluded from the social search audience.
 */
export async function searchStudents(query: string, take = 20) {
  const q = query.trim();
  if (q.length < 1) return [];
  return prisma.user.findMany({
    where: {
      role: { in: ["STUDENT", "LECTURER"] },
      isActive: true,
      OR: [
        { name: { contains: q } },
        { matricNum: { contains: q } },
        { program: { contains: q } },
        { faculty: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      role: true,
      matricNum: true,
      faculty: true,
      program: true,
      avatarPath: true,
    },
    // Students first, then lecturers, then alphabetical within each.
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take,
  });
}

/**
 * Fetch all comments for a post in chronological order. Resolves `postId` to
 * the parent if the passed ID is a repost row — comments live on originals.
 */
export async function getCommentsForPost(postId: number) {
  const post = await prisma.folioPost.findUnique({
    where: { id: postId },
    select: { id: true, isRepost: true, parentId: true },
  });
  if (!post) return [];
  const target = post.isRepost && post.parentId ? post.parentId : post.id;
  return prisma.folioComment.findMany({
    where: { postId: target },
    include: {
      author: {
        select: { id: true, name: true, matricNum: true, avatarPath: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type FolioComment = Awaited<ReturnType<typeof getCommentsForPost>>[number];
export type FolioFeedItem = Awaited<ReturnType<typeof getFolioFeed>>[number];
export type FolioProfile = NonNullable<Awaited<ReturnType<typeof getFolioProfile>>>;
export type StudentSearchHit = Awaited<ReturnType<typeof searchStudents>>[number];
