import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEnrolledCourseByCode } from "@/server/queries/courses";
import { getCurrentGroupForStudent } from "@/server/queries/groups";
import { EmptyState } from "@/components/common/EmptyState";
import { TrackAccess } from "@/components/dashboard/TrackAccess";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  FileText,
  Megaphone,
  Pin,
  ClipboardList,
  LineChart,
  Users,
} from "lucide-react";
import { formatDate, formatDateTime, initials, mediaUrl } from "@/lib/utils";
import { getCourseProgress } from "@/server/queries/progress";
import { ProgressList } from "@/components/progress/ProgressList";

type Tab = "general" | "notes" | "tugasan" | "progress";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { tab?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;
  const course = await getEnrolledCourseByCode(userId, params.code.toUpperCase());
  if (!course) notFound();

  const myGroup = await getCurrentGroupForStudent(userId, course.id);

  const tab: Tab = (["general", "notes", "tugasan", "progress"] as const).includes(
    searchParams.tab as Tab,
  )
    ? (searchParams.tab as Tab)
    : "general";

  const progress =
    tab === "progress"
      ? await getCourseProgress(course.id, userId, "STUDENT")
      : null;

  const generalContent = course.content.filter(
    (c) => c.type === "GENERAL" || c.type === "ANNOUNCEMENT" || c.type === "FORUM",
  );
  const notes = course.content.filter((c) => c.type === "NOTES" || c.type === "FILE");

  return (
    <div className="space-y-6">
      <TrackAccess
        type="COURSE"
        refId={course.id}
        title={`${course.code} — ${course.title}`}
        link={`/student/kursus/${course.code}`}
      />
      <Link
        href="/student/kursus"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ukm-navy"
      >
        <ArrowLeft size={16} /> Kembali ke kursus
      </Link>

      {myGroup && (
        <section className="card-elevated border-l-4 border-l-ukm-orange">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-ukm-orange">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Kumpulan Saya
                </p>
                <h2 className="text-base font-bold text-ukm-navy">{myGroup.name}</h2>
              </div>
              <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                {myGroup.members.length}/{myGroup.maxMembers} ahli
              </span>
            </div>
            <Link
              href={`/student/kumpulan?course=${course.code}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-ukm-teal hover:underline"
            >
              Lihat butiran <ArrowRight size={12} />
            </Link>
          </header>

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {myGroup.members.map((m) => {
              const isMe = m.studentId === userId;
              const isLeader = m.role === "LEADER";
              return (
                <li
                  key={m.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    isMe
                      ? "border-ukm-orange bg-orange-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ukm-teal to-ukm-cyan text-xs font-bold text-white">
                    {initials(m.student.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-ukm-navy">
                      {m.student.name}
                      {isMe && (
                        <span className="rounded-full bg-ukm-orange/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ukm-orange">
                          Anda
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-[11px] text-slate-500">
                      {m.student.matricNum ?? "—"}
                    </p>
                  </div>
                  {isLeader && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                      title="Ketua kumpulan"
                    >
                      <Crown size={10} /> Ketua
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <header className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ukm-orange">
              {course.code}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{course.description}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-500">
            <p>{course.semester}</p>
            {course.creditHours && <p>{course.creditHours} jam kredit</p>}
            {course.lecturer && <p className="mt-1 text-white">{course.lecturer.name}</p>}
          </div>
        </div>
      </header>

      <nav className="flex border-b border-slate-200">
        {(
          [
            { key: "general", label: "Umum", Icon: Megaphone },
            { key: "notes", label: "Nota dan Bahan Pembelajaran", Icon: FileText },
            { key: "tugasan", label: "Tugasan", Icon: ClipboardList },
            { key: "progress", label: "Progress", Icon: LineChart },
          ] as const
        ).map(({ key, label, Icon }) => (
          <Link
            key={key}
            href={`/student/kursus/${course.code}?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === key
                ? "border-b-2 border-ukm-orange text-white"
                : "text-slate-500 hover:text-ukm-navy"
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>

      {tab === "general" && (
        <section className="space-y-3">
          {generalContent.length === 0 ? (
            <EmptyState
              title="Tiada pengumuman"
              description="Pensyarah akan menyiarkan pengumuman dan bahan umum di sini."
            />
          ) : (
            generalContent.map((c) => (
              <article
                key={c.id}
                className={`card ${
                  c.type === "ANNOUNCEMENT" ? "border-ukm-orange/30 bg-ukm-orange/5" : ""
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  {c.type === "ANNOUNCEMENT" ? (
                    <>
                      <Pin size={12} className="text-ukm-orange" />
                      <span className="text-ukm-orange">Pengumuman</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={12} /> {c.type}
                    </>
                  )}
                  <span className="ml-auto">{formatDateTime(c.postedAt)}</span>
                </div>
                <h3 className="text-base font-semibold">{c.title}</h3>
                {c.content && <p className="mt-1 text-sm text-slate-700">{c.content}</p>}
                {c.postedBy && (
                  <p className="mt-2 text-xs text-slate-500">— {c.postedBy.name}</p>
                )}
              </article>
            ))
          )}
        </section>
      )}

      {tab === "notes" && (
        <section className="space-y-2">
          {notes.length === 0 ? (
            <EmptyState title="Tiada nota" description="Nota kuliah akan dimuat naik di sini." />
          ) : (
            notes.map((n) => (
              <article
                key={n.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <FileText className="text-ukm-teal" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500">
                    {n.fileName ?? "—"}
                    {n.fileSize ? ` · ${n.fileSize}` : ""} · {formatDate(n.postedAt)}
                  </p>
                </div>
                {n.filePath && (
                  <div className="flex gap-1">
                    <a
                      href={mediaUrl(n.filePath) ?? n.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-ukm-teal px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:bg-sky-600"
                    >
                      Lihat
                    </a>
                    <a
                      href={mediaUrl(n.filePath) ?? n.filePath}
                      download={n.fileName ?? undefined}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-ukm-teal hover:bg-sky-50"
                    >
                      Muat turun
                    </a>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      )}

      {tab === "tugasan" && (
        <section className="space-y-3">
          {course.assignments.length === 0 ? (
            <EmptyState title="Tiada tugasan" />
          ) : (
            course.assignments.map((a) => {
              const sub = a.submissions[0];
              const due = a.dueDate ? new Date(a.dueDate) : null;
              const isPast = due ? due < new Date() : false;
              // The whole row links to the tugasan detail page, where the student
              // can submit, resend, or withdraw — even after it shows "Dihantar".
              return (
                <Link
                  key={a.id}
                  href={`/student/tugasan/${a.id}`}
                  className="card block transition hover:border-ukm-teal hover:shadow-lift"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{a.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {a.type === "GROUP" ? "Kumpulan" : "Individu"}
                        {due && ` · Tarikh akhir: ${formatDateTime(due)}`}
                        {a.maxGrade && ` · Max: ${a.maxGrade}`}
                      </p>
                      {a.description && (
                        <p className="mt-2 text-sm text-slate-700">{a.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {sub ? (
                        <>
                          <span
                            className={`rounded-md px-2 py-1 text-xs ${
                              sub.status === "GRADED"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : sub.status === "LATE"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-ukm-cyan/15 text-ukm-teal"
                            }`}
                          >
                            {sub.status === "GRADED"
                              ? `Markah: ${sub.grade ?? "—"}`
                              : sub.status === "LATE"
                                ? "Lewat"
                                : "Dihantar"}
                          </span>
                          {sub.status !== "GRADED" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-ukm-teal">
                              Urus penghantaran <ArrowRight size={12} />
                            </span>
                          )}
                        </>
                      ) : isPast ? (
                        <span className="rounded-md bg-red-500/15 px-2 py-1 text-xs text-red-300">
                          Terlepas tarikh
                        </span>
                      ) : (
                        <span className="btn-primary text-sm">Hantar</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      )}

      {tab === "progress" && progress && (
        <section className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-ukm-navy">
              Status Penyiapan Anda
            </h3>
            <p className="text-xs text-slate-500">
              Status diterbitkan terus daripada penghantaran &amp; tarikh akhir.
            </p>
          </div>
          <ProgressList data={progress} />
        </section>
      )}
    </div>
  );
}
