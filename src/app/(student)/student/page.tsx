import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEnrolledCourses } from "@/server/queries/courses";
import { getUpcomingAssignments } from "@/server/queries/submissions";
import { getNotificationsForUser } from "@/server/queries/notifications";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/common/EmptyState";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardList,
  MessageCircle,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type UpcomingAssignment = Awaited<ReturnType<typeof getUpcomingAssignments>>[number];
type Notification = Awaited<ReturnType<typeof getNotificationsForUser>>[number];
type EnrolledCourse = Awaited<ReturnType<typeof getEnrolledCourses>>[number];

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const userId = session.user.id;

  let enrollmentsCount = 0;
  let groupMembershipsCount = 0;
  let upcomingAssignmentsCount = 0;
  let unreadMessages = 0;
  let upcoming: UpcomingAssignment[] = [];
  let notifications: Notification[] = [];
  let courses: EnrolledCourse[] = [];

  try {
    [
      enrollmentsCount,
      groupMembershipsCount,
      upcomingAssignmentsCount,
      unreadMessages,
      upcoming,
      notifications,
      courses,
    ] = await Promise.all([
      prisma.classEnrollment.count({
        where: {
          studentId: userId,
        },
      }),

      prisma.groupMember.count({
        where: {
          studentId: userId,
        },
      }),

      prisma.assignment.count({
        where: {
          course: {
            enrollments: {
              some: {
                studentId: userId,
              },
            },
          },
          dueDate: {
            gte: new Date(),
          },
        },
      }),

      prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      }),

      getUpcomingAssignments(userId, 5),
      getNotificationsForUser(userId, 8),
      getEnrolledCourses(userId),
    ]);
  } catch (error) {
    console.error("Student dashboard database query failed:", error);

    enrollmentsCount = 0;
    groupMembershipsCount = 0;
    upcomingAssignmentsCount = 0;
    unreadMessages = 0;
    upcoming = [];
    notifications = [];
    courses = [];
  }

  const stats = [
    {
      label: "Kursus Aktif",
      value: enrollmentsCount,
      Icon: BookOpen,
      accent: "text-ukm-teal",
      bg: "bg-sky-50",
    },
    {
      label: "Kumpulan Aktif",
      value: groupMembershipsCount,
      Icon: Users,
      accent: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Tugasan Akan Datang",
      value: upcomingAssignmentsCount,
      Icon: ClipboardList,
      accent: "text-ukm-orange",
      bg: "bg-orange-50",
    },
    {
      label: "Mesej Belum Baca",
      value: unreadMessages,
      Icon: MessageCircle,
      accent: "text-pink-600",
      bg: "bg-pink-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="gradient-hero relative overflow-hidden rounded-2xl px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white/10" />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/80">
            SMARTCOLLAB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            Selamat datang, {session.user.name}
          </h1>
          <p className="mt-1 text-sm text-white/90">
            Papan pemuka pelajar UKMFolio
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, accent, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${bg}`}>
              <Icon className={accent} size={22} />
            </div>

            <div>
              <p className="text-3xl font-bold text-ukm-navy">{value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ukm-navy">
              <CalendarClock className="text-ukm-orange" size={18} />
              Tugasan Akan Datang
            </h2>

            <Link
              href="/student/tugasan"
              className="inline-flex items-center gap-1 text-xs font-medium text-ukm-teal hover:underline"
            >
              Lihat semua <ArrowRight size={12} />
            </Link>
          </header>

          {upcoming.length === 0 ? (
            <EmptyState
              title="Tiada tugasan akan datang"
              description="Tugasan dengan tarikh akhir akan muncul di sini."
            />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ukm-navy">
                      {a.title}
                    </p>

                    <p className="text-xs text-slate-500">
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 font-mono font-semibold text-ukm-orange">
                        {a.course.code}
                      </span>{" "}
                      · {a.dueDate ? formatDate(a.dueDate) : "Tiada tarikh akhir"}
                    </p>
                  </div>

                  {a.submissions[0] ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {a.submissions[0].status === "GRADED"
                        ? "Dimarkah"
                        : "Dihantar"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Belum mula
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="mb-3 flex items-center gap-2">
            <Bell className="text-ukm-teal" size={18} />
            <h2 className="text-lg font-semibold text-ukm-navy">
              Aktiviti Terkini
            </h2>
          </header>

          {notifications.length === 0 ? (
            <EmptyState title="Tiada notifikasi" />
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ukm-navy">
                      {n.title}
                    </p>

                    {!n.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ukm-orange" />
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatDate(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ukm-navy">Kursus Saya</h2>

          <Link
            href="/student/kursus"
            className="text-xs text-ukm-teal hover:underline"
          >
            Lihat semua
          </Link>
        </header>

        {courses.length === 0 ? (
          <EmptyState
            title="Tiada kursus"
            description="Anda belum berdaftar dalam mana-mana kursus. Hubungi pentadbir."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <CourseCard
                key={c.id}
                code={c.code}
                title={c.title}
                lecturerName={c.lecturer?.name ?? null}
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