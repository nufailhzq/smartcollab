import { prisma } from "@/lib/prisma";

export type FriendshipStatusInfo =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "pending-sent"; friendshipId: number }
  | { kind: "pending-received"; friendshipId: number }
  | { kind: "accepted"; friendshipId: number };

/**
 * Resolve the friendship state between the viewer and another user.
 * Drives the "Tambah Rakan" / "Permintaan dihantar" / "Rakan" button on
 * the Folio profile page.
 */
export async function getFriendshipStatus(
  viewerId: number,
  otherId: number,
): Promise<FriendshipStatusInfo> {
  if (viewerId === otherId) return { kind: "self" };

  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: viewerId, receiverId: otherId },
        { senderId: otherId, receiverId: viewerId },
      ],
    },
    select: { id: true, senderId: true, status: true },
  });
  if (!f) return { kind: "none" };
  if (f.status === "ACCEPTED") return { kind: "accepted", friendshipId: f.id };
  return f.senderId === viewerId
    ? { kind: "pending-sent", friendshipId: f.id }
    : { kind: "pending-received", friendshipId: f.id };
}
