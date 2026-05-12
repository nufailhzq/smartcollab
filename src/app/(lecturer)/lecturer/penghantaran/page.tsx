import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLecturerSubmissions, getTaughtCourses } from "@/server/queries/lecturer";
import { EmptyState } from "@/components/common/EmptyState";
import { GradingPanel } from "./grading-panel";
import { FileCheck } from "lucide-react";
import type { SubmissionStatus } from "@prisma/client";

const STATUS_OPTIONS = ["ALL", "SUBMITTED", "LATE", "GRADED"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

export default async function LecturerSubmissionsPage({
  searchParams,
}: {
  searchParams: { course?: string; assignment?: string; status?: string };
}) {
  const session = await auth();
  const lecturerId = session!.user.id;

  const courses = await getTaughtCourses(lecturerId);
  const courseCode = searchParams.course?.toUpperCase();
  const selectedCourse = courseCode ? courses.find((c) => c.code === courseCode) : null;
  const assignmentId = searchParams.assignment ? Number(searchParams.assignment) : undefined;
  const status: StatusFilter = STATUS_OPTIONS.includes(searchParams.status as StatusFilter)
    ? (searchParams.status as StatusFilter)
    : "ALL";

  const submissions = await getLecturerSubmissions(lecturerId, {
    courseId: selectedCourse?.id,
    assignmentId,
    status: status as SubmissionStatus | "ALL",
  });

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">Penghantaran Pelajar</h1>
          <p className="mt-1 text-sm text-white/80">
            Tapis dan beri markah untuk penghantaran tugasan kursus anda.
          </p>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">Kursus</label>
          <form>
            <select
              name="course"
              defaultValue={courseCode ?? "ALL"}
              className="input-base"
            >
              <option value="ALL">Semua kursus</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
            <noscript>
              <button type="submit" className="btn-secondary mt-2 text-xs">
                Tapis
              </button>
            </noscript>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const params = new URLSearchParams();
            if (courseCode) params.set("course", courseCode);
            if (assignmentId) params.set("assignment", String(assignmentId));
            if (s !== "ALL") params.set("status", s);
            const qs = params.toString();
            const href = `/lecturer/penghantaran${qs ? `?${qs}` : ""}`;
            return (
              <Link
                key={s}
                href={href}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  status === s
                    ? "bg-ukm-orange text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-ukm-teal hover:bg-sky-50"
                }`}
              >
                {s === "ALL"
                  ? "Semua"
                  : s === "SUBMITTED"
                    ? "Dihantar"
                    : s === "LATE"
                      ? "Lewat"
                      : "Dimarkah"}
              </Link>
            );
          })}
        </div>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="Tiada penghantaran"
          description="Tiada penghantaran sepadan dengan tapisan anda."
          Icon={FileCheck}
        />
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <li key={s.id} className="card">
              <GradingPanel
                submission={{
                  id: s.id,
                  studentName: s.student.name,
                  studentMatric: s.student.matricNum,
                  assignmentTitle: s.assignment.title,
                  assignmentType: s.assignment.type,
                  courseCode: s.assignment.course.code,
                  courseTitle: s.assignment.course.title,
                  filePath: s.filePath,
                  grade: s.grade,
                  status: s.status,
                  maxGrade: s.assignment.maxGrade ?? 100,
                  submittedAt: s.submittedAt.toISOString(),
                  dueDate: s.assignment.dueDate?.toISOString() ?? null,
                  feedback: s.feedback.map((f) => ({
                    id: f.id,
                    comment: f.comment,
                    lecturerName: f.lecturer.name,
                    createdAt: f.createdAt.toISOString(),
                  })),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
