import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileCheck,
  Users,
} from "lucide-react";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime } from "@/lib/utils";

export default async function LecturerDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [coursesTaught, pendingGrades, totalStudents, lateSubmissions, courses, recentSubs] =
    await Promise.all([
      prisma.course.count({ where: { lecturerId: userId } }),
      prisma.submission.count({
        where: { status: "SUBMITTED", assignment: { course: { lecturerId: userId } } },
      }),
      prisma.classEnrollment.count({ where: { course: { lecturerId: userId } } }),
      prisma.submission.count({
        where: { status: "LATE", assignment: { course: { lecturerId: userId } } },
      }),
      prisma.course.findMany({
        where: { lecturerId: userId },
        include: {
          lecturer: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, assignments: true } },
        },
        orderBy: { code: "asc" },
        take: 6,
      }),
      prisma.submission.findMany({
        where: {
          status: { in: ["SUBMITTED", "LATE"] },
          assignment: { course: { lecturerId: userId } },
        },
        include: {
          student: { select: { name: true, matricNum: true } },
          assignment: {
            select: { title: true, maxGrade: true, course: { select: { code: true } } },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 6,
      }),
    ]);

  const stats = [
    { label: "Kursus Diajar", value: coursesTaught, Icon: BookOpen, accent: "text-ukm-teal", bg: "bg-sky-50" },
    {
      label: "Belum Markah",
      value: pendingGrades,
      Icon: ClipboardCheck,
      accent: "text-ukm-orange",
      bg: "bg-orange-50",
    },
    { label: "Pelajar", value: totalStudents, Icon: Users, accent: "text-purple-600", bg: "bg-purple-50" },
    {
      label: "Penghantaran Lewat",
      value: lateSubmissions,
      Icon: AlertTriangle,
      accent: "text-ukm-red",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="gradient-hero relative overflow-hidden rounded-2xl px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/80">SMARTCOLLAB</p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            Selamat datang, {session!.user.name}
          </h1>
          <p className="mt-1 text-sm text-white/90">Papan pemuka pensyarah UKMFolio</p>
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
              <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ukm-navy">
              <FileCheck className="text-ukm-orange" size={18} /> Penghantaran Terkini
            </h2>
            <Link
              href="/lecturer/penghantaran"
              className="inline-flex items-center gap-1 text-xs font-medium text-ukm-teal hover:underline"
            >
              Lihat semua <ArrowRight size={12} />
            </Link>
          </header>
          {recentSubs.length === 0 ? (
            <EmptyState
              title="Tiada penghantaran terkini"
              description="Penghantaran baharu pelajar akan muncul di sini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pelajar</th>
                    <th>Tugasan</th>
                    <th>Status</th>
                    <th>Hantar</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubs.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <p className="font-medium text-ukm-navy">{s.student.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {s.student.matricNum}
                        </p>
                      </td>
                      <td>
                        <p className="text-sm">{s.assignment.title}</p>
                        <p className="font-mono text-[11px] text-ukm-orange">
                          {s.assignment.course.code}
                        </p>
                      </td>
                      <td>
                        <span
                          className={
                            s.status === "LATE"
                              ? "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                              : "inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
                          }
                        >
                          {s.status === "LATE" ? "Lewat" : "Dihantar"}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{formatDateTime(s.submittedAt)}</td>
                      <td>
                        <Link
                          href={`/lecturer/penghantaran?course=${s.assignment.course.code}`}
                          className="text-xs font-medium text-ukm-teal hover:underline"
                        >
                          Markah
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <header className="mb-3 flex items-center gap-2">
            <BookOpen className="text-ukm-teal" size={18} />
            <h2 className="text-lg font-semibold text-ukm-navy">Pintasan</h2>
          </header>
          <ul className="space-y-2 text-sm">
            <ShortcutLink href="/lecturer/kursus" label="Senarai Kursus Saya" />
            <ShortcutLink href="/lecturer/pengurusan-kumpulan" label="Urus Kumpulan Pelajar" />
            <ShortcutLink href="/lecturer/penghantaran" label="Penghantaran & Markah" />
            <ShortcutLink href="/lecturer/pemantauan" label="Progress Monitoring" />
            <ShortcutLink href="/lecturer/kalendar" label="Kalendar" />
          </ul>
        </section>
      </div>

      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ukm-navy">Kursus Saya</h2>
          <Link href="/lecturer/kursus" className="text-xs text-ukm-teal hover:underline">
            Lihat semua
          </Link>
        </header>
        {courses.length === 0 ? (
          <EmptyState
            title="Tiada kursus diajar"
            description="Hubungi pentadbir untuk pengagihan kursus."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                code={c.code}
                title={c.title}
                lecturerName={`${c._count.enrollments} pelajar · ${c._count.assignments} tugasan`}
                semester={c.semester}
                creditHours={c.creditHours}
                href={`/lecturer/kursus/${c.code}`}
                ctaLabel="Urus"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-ukm-teal hover:bg-sky-50 hover:text-ukm-navy"
      >
        <span>{label}</span>
        <ArrowRight size={14} className="text-slate-400" />
      </Link>
    </li>
  );
}
