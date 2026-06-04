import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTaughtCourseByCode } from "@/server/queries/lecturer";
import { EmptyState } from "@/components/common/EmptyState";
import { TrackAccess } from "@/components/dashboard/TrackAccess";
import { ArrowLeft, ClipboardList, FileText, Megaphone, Users } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { CourseAuthoring } from "./course-authoring";

type Tab = "general" | "notes" | "tugasan" | "kumpulan";

export default async function LecturerCourseDetailPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { tab?: string };
}) {
  const session = await auth();
  const course = await getTaughtCourseByCode(session!.user.id, params.code.toUpperCase());
  if (!course) notFound();

  const tab: Tab = (["general", "notes", "tugasan", "kumpulan"] as const).includes(
    searchParams.tab as Tab,
  )
    ? (searchParams.tab as Tab)
    : "general";

  const generalContent = course.content.filter(
    (c) => c.type === "GENERAL" || c.type === "ANNOUNCEMENT" || c.type === "FORUM",
  );
  const notes = course.content.filter((c) => c.type === "NOTES" || c.type === "FILE");

  const tabs = [
    { key: "general", label: "Umum / Pengumuman", Icon: Megaphone },
    { key: "notes", label: "Nota & Bahan", Icon: FileText },
    { key: "tugasan", label: "Tugasan", Icon: ClipboardList },
    { key: "kumpulan", label: "Kumpulan", Icon: Users },
  ] as const;

  return (
    <div className="space-y-6">
      <TrackAccess
        type="COURSE"
        refId={course.id}
        title={`${course.code} — ${course.title}`}
        link={`/lecturer/kursus/${course.code}`}
      />
      <Link
        href="/lecturer/kursus"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ukm-navy"
      >
        <ArrowLeft size={16} /> Kembali ke kursus
      </Link>

      <header className="card-elevated">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="rounded-md bg-orange-100 px-2 py-1 font-mono text-xs font-semibold text-ukm-orange">
              {course.code}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-ukm-navy">{course.title}</h1>
            {course.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{course.description}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-600">
            <p>{course.semester}</p>
            {course.creditHours && <p>{course.creditHours} jam kredit</p>}
            <p className="mt-1 text-ukm-navy">{course._count.enrollments} pelajar</p>
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map(({ key, label, Icon }) => (
          <Link
            key={key}
            href={`/lecturer/kursus/${course.code}?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === key
                ? "border-b-2 border-ukm-orange text-ukm-orange"
                : "border-b-2 border-transparent text-slate-500 hover:text-ukm-navy"
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>

      {tab === "general" && (
        <section className="space-y-4">
          <CourseAuthoring courseId={course.id} mode="content" />
          {generalContent.length === 0 ? (
            <EmptyState
              title="Tiada pengumuman"
              description="Pos pengumuman atau bahan umum di atas."
            />
          ) : (
            generalContent.map((c) => (
              <article
                key={c.id}
                className={`card ${
                  c.type === "ANNOUNCEMENT" ? "border-ukm-orange bg-orange-50" : ""
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  {c.type === "ANNOUNCEMENT" ? (
                    <span className="text-ukm-orange">📌 Pengumuman</span>
                  ) : (
                    <span>{c.type}</span>
                  )}
                  <span className="ml-auto">{formatDateTime(c.postedAt)}</span>
                </div>
                <h3 className="text-base font-semibold text-ukm-navy">{c.title}</h3>
                {c.content && <p className="mt-1 text-sm text-slate-700">{c.content}</p>}
              </article>
            ))
          )}
        </section>
      )}

      {tab === "notes" && (
        <section className="space-y-4">
          <CourseAuthoring courseId={course.id} mode="notes" />
          {notes.length === 0 ? (
            <EmptyState title="Tiada nota" description="Muat naik nota kuliah atau bahan rujukan." />
          ) : (
            notes.map((n) => (
              <article
                key={n.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <FileText className="text-ukm-teal" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ukm-navy">{n.title}</p>
                  <p className="text-xs text-slate-500">
                    {n.fileName ?? "—"} · {formatDateTime(n.postedAt)}
                  </p>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {tab === "tugasan" && (
        <section className="space-y-4">
          <CourseAuthoring courseId={course.id} mode="assignment" />
          {course.assignments.length === 0 ? (
            <EmptyState title="Tiada tugasan" description="Cipta tugasan baharu di atas." />
          ) : (
            course.assignments.map((a) => {
              const submitted = a.submissions.length;
              const graded = a.submissions.filter((s) => s.status === "GRADED").length;
              return (
                <article key={a.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ukm-navy">{a.title}</h3>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            a.type === "GROUP"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {a.type === "GROUP" ? "Kumpulan" : "Individu"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Tarikh akhir:{" "}
                        {a.dueDate ? formatDateTime(a.dueDate) : "—"}
                        {a.maxGrade && ` · Max ${a.maxGrade}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p className="font-bold text-ukm-navy">
                        {graded}/{submitted}
                      </p>
                      <p className="text-slate-400">dimarkah</p>
                      <Link
                        href={`/lecturer/penghantaran?assignment=${a.id}`}
                        className="mt-1 inline-block text-xs font-medium text-ukm-teal hover:underline"
                      >
                        Buka penghantaran →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {tab === "kumpulan" && (
        <section className="space-y-4">
          <div className="card flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-ukm-navy">Kumpulan Kursus Ini</h3>
              <p className="text-xs text-slate-500">
                Buat dan urus ahli kumpulan dari halaman pengurusan kumpulan.
              </p>
            </div>
            <Link
              href={`/lecturer/pengurusan-kumpulan?course=${course.code}`}
              className="btn-primary"
            >
              <Users size={14} /> Buka Urus Kumpulan
            </Link>
          </div>
          {course.groups.length === 0 ? (
            <EmptyState title="Tiada kumpulan" description="Belum ada kumpulan dalam kursus ini." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {course.groups.map((g) => (
                <article key={g.id} className="card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ukm-navy">{g.name}</h3>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                      {g._count.members}/{g.maxMembers}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {g.members.map((m) => (
                      <li key={m.id} className="flex items-center justify-between">
                        <span>{m.student.name}</span>
                        <span className="font-mono text-slate-400">{m.student.matricNum}</span>
                      </li>
                    ))}
                    {g.members.length === 0 && (
                      <li className="italic text-slate-400">Tiada ahli lagi.</li>
                    )}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
