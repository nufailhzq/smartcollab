import { auth } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { LogOut } from "lucide-react";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
} from "@/server/queries/notifications";
import {
  getChatGroupsForUser,
  getContactsForUser,
  getPendingFriendRequests,
  getTotalUnreadForUser,
} from "@/server/queries/messages";
import { NotificationBell } from "./NotificationBell";
import { MessengerBubble } from "./MessengerBubble";

const ROLE_BADGE: Record<"STUDENT" | "LECTURER" | "ADMIN", string> = {
  STUDENT: "badge-student",
  LECTURER: "badge-lecturer",
  ADMIN: "badge-admin",
};

const ROLE_LABEL: Record<"STUDENT" | "LECTURER" | "ADMIN", string> = {
  STUDENT: "Pelajar",
  LECTURER: "Pensyarah",
  ADMIN: "Admin",
};

export async function Navbar() {
  const session = await auth();
  if (!session) return null;

  const userId = session.user.id;
  const userRole = session.user.role;

  let notifications: Awaited<ReturnType<typeof getNotificationsForUser>> = [];
  let unreadNotifications = 0;
  let contacts: Awaited<ReturnType<typeof getContactsForUser>> = [];
  let totalUnread = 0;
  let pendingRequests: Awaited<ReturnType<typeof getPendingFriendRequests>> = [];
  let chatGroups: Awaited<ReturnType<typeof getChatGroupsForUser>> = [];

  try {
    [
      notifications,
      unreadNotifications,
      contacts,
      totalUnread,
      pendingRequests,
      chatGroups,
    ] = await Promise.all([
      getNotificationsForUser(userId, 20),
      getUnreadNotificationCount(userId),
      getContactsForUser(userId, userRole),
      getTotalUnreadForUser(userId),
      getPendingFriendRequests(userId),
      getChatGroupsForUser(userId),
    ]);
  } catch (error) {
    console.error("Navbar database query failed:", error);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-ukm-teal to-ukm-cyan font-black text-white shadow-sm">
              U
            </div>

            <div className="leading-tight">
              <p className="text-sm font-bold">
                <span className="text-ukm-navy">UKM</span>
                <span className="text-ukm-orange">FOLIO</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                SMARTCOLLAB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell
              initialUnreadCount={unreadNotifications}
              initialNotifications={notifications.map((n) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                link: n.link,
                isRead: n.isRead,
                createdAt: n.createdAt.toISOString(),
              }))}
            />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ukm-navy">
                {session.user.name}
              </p>
              <p className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
                <span className={ROLE_BADGE[userRole]}>
                  {ROLE_LABEL[userRole]}
                </span>
                <span>{session.user.matricNum ?? session.user.email}</span>
              </p>
            </div>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-sm font-bold text-ukm-orange ring-2 ring-white">
              {initials(session.user.name ?? "?")}
            </div>

            <form action="/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-red"
                aria-label="Log keluar"
                title="Log keluar"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <MessengerBubble
        currentUserId={userId}
        initialUnreadTotal={totalUnread}
        initialContacts={contacts.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          matricNum: c.matricNum,
          unread: c.unread,
          isFriend: c.isFriend,
          relationship: c.relationship,
          lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
        }))}
        initialFriendRequests={pendingRequests.map((fr) => ({
          id: fr.id,
          sender: {
            id: fr.sender.id,
            name: fr.sender.name,
            role: fr.sender.role,
            matricNum: fr.sender.matricNum,
          },
        }))}
        initialChatGroups={chatGroups.map((g) => ({
          id: g.id,
          name: g.name,
          memberCount: g.memberCount,
          unread: g.unread,
          lastMessageAt: g.lastMessageAt ? g.lastMessageAt.toISOString() : null,
          lastMessagePreview: g.lastMessagePreview,
          lastSenderName: g.lastSenderName,
          isAdmin: g.isAdmin,
        }))}
      />
    </>
  );
}