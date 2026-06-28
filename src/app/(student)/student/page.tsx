import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEnrolledCourses } from "@/server/queries/courses";
import { getUpcomingAssignments } from "@/server/queries/submissions";
import {
  getNotificationsForUser,
  getActiveWarningsForUser,
} from "@/server/queries/notifications";
import { getActiveBulletins } from "@/server/queries/bulletins";
import { getRecentAccess } from "@/server/queries/recent-access";
import { getUpcomingForUser } from "@/server/queries/upcoming";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/common/EmptyState";
import { BulletinBoard } from "@/components/dashboard/BulletinBoard";
import { WarningBanner } from "@/components/dashboard/WarningBanner";
import { RecentAccessPanel } from "@/components/dashboard/RecentAccessPanel";
import { UpcomingEventsPanel } from "@/components/dashboard/UpcomingEventsPanel";
import { StatTile } from "@/components/dashboard/StatTile";
import { DeadlineTimeline } from "@/components/dashboard/DeadlineTimeline";
import { ArrowRight, Bell, BookOpen, CalendarClock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

type UpcomingAssignment = Awaited<ReturnType<typeof getUpcomingAssignments>>[number];
type Notification = Awaited<ReturnType<typeof getNotificationsForUser>>[number];
type EnrolledCourse = Awaited<ReturnType<typeof getEnrolledCourses>>[number];
type ActiveBulletin = Awaited<ReturnType<typeof getActiveBulletins>>[number];
type RecentAccessItem = Awaited<ReturnType<typeof getRecentAccess>>[number];
type UpcomingItem = Awaited<ReturnType<typeof getUpcomingForUser>>[number];

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  let enrollmentsCount = 0;
  let groupMembershipsCount = 0;
  let upcomingAssignmentsCount = 0;
  let unreadMessages = 0;
  let upcoming: UpcomingAssignment[] = [];
  let notifications: Notification[] = [];
  let courses: EnrolledCourse[] = [];
  let bulletins: ActiveBulletin[] = [];
  let recentAccess: RecentAccessItem[] = [];
  let upcomingEvents: UpcomingItem[] = [];
  let warnings: Awaited<ReturnType<typeof getActiveWarningsForUser>> = [];

  try {
    [
      enrollmentsCount,
      groupMembershipsCount,
      upcomingAssignmentsCount,
      unreadMessages,
      upcoming,
      notifications,
      courses,
      bulletins,
      recentAccess,
      upcomingEvents,
      warnings,
    ] = await Promise.all([
      prisma.classEnrollment.count({ where: { studentId: userId } }),
      prisma.groupMember.count({ where: { studentId: userId } }),
      prisma.assignment.count({
        where: {
          course: { enrollments: { some: { studentId: userId } } },
          dueDate: { gte: new Date() },
        },
      }),
      prisma.message.count({ where: { receiverId: userId, isRead: false } }),
      getUpcomingAssignments(userId, 5),
      getNotificationsForUser(userId, 8),
      getEnrolledCourses(userId),
      getActiveBulletins(5),
      getRecentAccess(userId, 5),
      getUpcomingForUser(userId, userRole, 6),
      getActiveWarningsForUser(userId, 5),
    ]);
  } catch (error) {
    console.error("Student dashboard database query failed:", error);
  }

  const stats = [
    {
      label: "Kursus Aktif",
      value: enrollmentsCount,
      icon: "courses" as const,
      gradient: "from-sky-500 to-cyan-400",
      glow: "rgba(14,165,233,0.45)",
    },
    {
      label: "Kumpulan Aktif",
      value: groupMembershipsCount,
      icon: "groups" as const,
      gradient: "from-violet-500 to-fuchsia-400",
      glow: "rgba(168,85,247,0.45)",
    },
    {
      label: "Tugasan Akan Datang",
      value: upcomingAssignmentsCount,
      icon: "assignments" as const,
      gradient: "from-orange-500 to-amber-400",
      glow: "rgba(249,115,22,0.45)",
    },
    {
      label: "Mesej Belum Baca",
      value: unreadMessages,
      icon: "messages" as const,
      gradient: "from-pink-500 to-rose-400",
      glow: "rgba(236,72,153,0.45)",
    },
  ];

  // Map the already-fetched upcoming assignments into serializable timeline
  // rows. No new queries — pure presentation transform.
  const deadlineRows = upcoming.map((a) => ({
    id: a.id,
    title: a.title,
    courseCode: a.course.code,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    state: (a.submissions[0]
      ? a.submissions[0].status === "GRADED"
        ? "GRADED"
        : "SUBMITTED"
      : "NONE") as "GRADED" | "SUBMITTED" | "NONE",
    href: `/student/tugasan/${a.id}`,
  }));

  return (
    <div className="space-y-6">
      <OnboardingGate />
      <WarningBanner
        warnings={warnings.map((w) => ({
          id: w.id,
          title: w.title,
          message: w.message,
          createdAt: w.createdAt.toISOString(),
        }))}
      />

      {/* Hero — calm gradient header (momentum ring removed in Stage 2). */}
      <div className="gradient-hero relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">
            SmartCollab
          </p>
          <h1 className="mt-1 truncate text-2xl font-extrabold text-white sm:text-3xl">
            Selamat datang, {session.user.name}
          </h1>
          <p className="mt-1 text-sm text-white/90">Papan pemuka pelajar UKMFolio</p>
        </div>
      </div>

      {/* KPI bento row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon, gradient, glow }, i) => (
          <StatTile
            key={label}
            label={label}
            value={value}
            icon={icon}
            gradient={gradient}
            glow={glow}
            delay={i * 70}
          />
        ))}
      </div>

      {/* Bento main grid */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <BulletinBoard bulletins={bulletins} />

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Deadlines — neon urgency timeline */}
            <section className="glass-card bento-tile p-5">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-ukm-navy">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-soft">
                    <CalendarClock size={16} />
                  </span>
                  Garis Masa Tugasan
                </h2>
                <Link
                  href="/student/tugasan"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-ukm-teal transition hover:bg-sky-50"
                >
                  Semua <ArrowRight size={12} />
                </Link>
              </header>
              <DeadlineTimeline rows={deadlineRows} />
            </section>

            {/* Activity feed */}
            <section className="glass-card bento-tile p-5">
              <header className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-soft">
                  <Bell size={16} />
                </span>
                <h2 className="text-base font-extrabold text-ukm-navy">Aktiviti Terkini</h2>
              </header>

              {notifications.length === 0 ? (
                <EmptyState title="Tiada notifikasi" />
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n, i) => (
                    <li
                      key={n.id}
                      className="group rounded-xl border border-slate-100 bg-white/70 px-3 py-2 backdrop-blur-sm transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:border-sky-300/60 hover:shadow-soft animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-ukm-navy">{n.title}</p>
                        {!n.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ukm-orange shadow-[0_0_8px_1px_rgba(249,115,22,0.7)]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="space-y-4 xl:col-span-1">
          <RecentAccessPanel items={recentAccess} />
          <UpcomingEventsPanel items={upcomingEvents} />
        </aside>
      </div>

      {/* Courses — showcase cards */}
      <section>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-ukm-navy">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white shadow-soft">
              <BookOpen size={16} />
            </span>
            Kursus Saya
          </h2>
          <Link
            href="/student/kursus"
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-ukm-teal transition hover:bg-sky-50"
          >
            Lihat semua <ArrowRight size={12} />
          </Link>
        </header>

        {courses.length === 0 ? (
          <EmptyState
            title="Tiada kursus"
            description="Anda belum berdaftar dalam mana-mana kursus. Hubungi pentadbir."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <CourseCard
                key={c.id}
                variant="showcase"
                code={c.code}
                title={c.title}
                lecturerId={c.lecturer?.id ?? null}
                lecturerName={c.lecturer?.name ?? null}
                lecturerAvatarPath={c.lecturer?.avatarPath ?? null}
                semester={c.semester}
                creditHours={c.creditHours}
                href={`/student/kursus/${c.code}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
