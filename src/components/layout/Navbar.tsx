import Image from "next/image";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/common/Avatar";
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
import { StudentSearchBar } from "@/components/folio/StudentSearchBar";
import { TranslateToggle } from "./TranslateToggle";
import { MobileNavToggle } from "./MobileNavToggle";
import { LogoutButton } from "./LogoutButton";
import { MessageStream } from "./MessageStream";
import { LiveRefresh } from "./LiveRefresh";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeApplier } from "./ThemeApplier";
import { IdleLogout } from "./IdleLogout";
import { dispatchDueEventReminders } from "@/server/actions/calendar";

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
  const dashboardHref =
    userRole === "ADMIN"
      ? "/admin"
      : userRole === "LECTURER"
        ? "/lecturer"
        : "/student";
  const profileHref =
    userRole === "ADMIN"
      ? "/admin"
      : userRole === "LECTURER"
        ? "/lecturer/profil"
        : "/student/profil";

  let notifications: Awaited<ReturnType<typeof getNotificationsForUser>> = [];
  let unreadNotifications = 0;
  let contacts: Awaited<ReturnType<typeof getContactsForUser>> = [];
  let totalUnread = 0;
  let pendingRequests: Awaited<ReturnType<typeof getPendingFriendRequests>> = [];
  let chatGroups: Awaited<ReturnType<typeof getChatGroupsForUser>> = [];
  let avatarPath: string | null = null;
  let mutedIds: number[] = [];
  let notificationsMuted = false;
  let theme = "aurora";

  try {
    const [_n, _un, _c, _tu, _pr, _cg, userRow, mutes] = await Promise.all([
      getNotificationsForUser(userId, 20),
      getUnreadNotificationCount(userId),
      getContactsForUser(userId, userRole),
      getTotalUnreadForUser(userId),
      getPendingFriendRequests(userId),
      getChatGroupsForUser(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { avatarPath: true, notificationsMuted: true, theme: true },
      }),
      prisma.userMute.findMany({
        where: { muterId: userId },
        select: { mutedId: true },
      }),
    ]);
    notifications = _n;
    unreadNotifications = _un;
    contacts = _c;
    totalUnread = _tu;
    pendingRequests = _pr;
    chatGroups = _cg;
    avatarPath = userRow?.avatarPath ?? null;
    notificationsMuted = userRow?.notificationsMuted ?? false;
    theme = userRow?.theme ?? "aurora";
    mutedIds = mutes.map((m) => m.mutedId);
  } catch (error) {
    console.error("Navbar database query failed:", error);
  }

  // Fire any due calendar reminders for this viewer. Throttled inside the
  // action to one batch per 60s per user, so it's safe to call on every load.
  try {
    await dispatchDueEventReminders(userId);
  } catch (err) {
    console.error("Reminder dispatch failed:", err);
  }

  return (
    <>
      <ThemeApplier theme={theme} />
      <MessageStream
        currentUserId={userId}
        mutedIds={mutedIds}
        notificationsMuted={notificationsMuted}
      />
      <LiveRefresh />
      <IdleLogout />
      <header className="glass sticky top-0 z-30 border-b border-slate-200/70 shadow-sm">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNavToggle />
            <Link
              href={dashboardHref}
              aria-label="Ke Dashboard"
              className="group flex items-center gap-2 rounded-lg transition hover:opacity-90 sm:gap-3"
            >
              <Image
                src="/images/navbar/SmartCollabLogo.png"
                alt="SmartCollab"
                width={40}
                height={40}
                priority
                className="h-9 w-9 object-contain transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-6 sm:h-10 sm:w-10"
              />

              <div className="leading-tight">
                <p className="font-display text-base font-extrabold tracking-tight sm:text-lg">
                  <span className="text-ukm-navy">UKM</span>
                  <span className="text-ukm-orange">FOLIO</span>
                </p>
                <p className="brand-gradient-text hidden text-[11px] font-bold uppercase tracking-[0.2em] sm:block">
                  SMARTCOLLAB
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {(userRole === "STUDENT" || userRole === "LECTURER") && (
              <div className="hidden md:block">
                <StudentSearchBar />
              </div>
            )}

            {/* Folio Connect — moved out of the sidebar into a topbar icon
                beside the search bar. (Stage 4 may enhance with a dropdown.) */}
            {(userRole === "STUDENT" || userRole === "LECTURER") && (
              <Link
                href="/folio"
                aria-label="Folio Connect"
                title="Folio Connect"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
              >
                <Link2 size={18} />
              </Link>
            )}

            <ThemeToggle />

            <div className="hidden sm:block">
              <TranslateToggle />
            </div>

            <NotificationBell
              initialUnreadCount={unreadNotifications}
              notificationsMuted={notificationsMuted}
              userRole={userRole}
              initialNotifications={notifications.map((n) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                link: n.link,
                isRead: n.isRead,
                createdAt: n.createdAt.toISOString(),
              }))}
            />

            <div className="hidden text-right lg:block">
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

            <Link
              href={profileHref}
              aria-label="Ke profil"
              title="Profil"
              className="rounded-full transition hover:scale-105"
            >
              <Avatar
                name={session.user.name ?? "?"}
                avatarPath={avatarPath}
                size="md"
                ring
              />
            </Link>

            <LogoutButton />
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
          origin: g.origin,
        }))}
      />
    </>
  );
}