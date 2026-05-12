import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEnrolledCourseByCode } from "@/server/queries/courses";
import { EmptyState } from "@/components/common/EmptyState";
import { ArrowLeft, BookOpen, FileText, Megaphone, Pin, ClipboardList } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

type Tab = "general" | "notes" | "tugasan";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { tab?: string };
}) {
  const session = await auth();
  const course = await getEnrolledCourseByCode(session!.user.id, params.code.toUpperCase());
  if (!course) notFound();

  const tab: Tab = (["general", "notes", "tugasan"] as const).includes(searchParams.tab as Tab)
    ? (searchParams.tab as Tab)
    : "general";

  const generalContent = course.content.filter(
    (c) => c.type === "GENERAL" || c.type === "ANNOUNCEMENT" || c.type === "FORUM",
  );
  const notes = course.content.filter((c) => c.type === "NOTES" || c.type === "FILE");

  return (
    <div className="space-y-6">
      <Link
        href="/student/kursus"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ukm-navy"
      >
        <ArrowLeft size={16} /> Kembali ke kursus
      </Link>

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
              return (
                <article key={a.id} className="card">
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
                      ) : isPast ? (
                        <span className="rounded-md bg-red-500/15 px-2 py-1 text-xs text-red-300">
                          Terlepas tarikh
                        </span>
                      ) : (
                        <Link
                          href={`/student/tugasan/${a.id}`}
                          className="btn-primary text-sm"
                        >
                          Hantar
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
