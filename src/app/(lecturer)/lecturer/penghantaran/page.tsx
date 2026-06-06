import { auth } from "@/lib/auth";
import { getLecturerSubmissions, getTaughtCourses } from "@/server/queries/lecturer";
import { EmptyState } from "@/components/common/EmptyState";
import { GradingPanel } from "./grading-panel";
import { FilterMenu } from "./filter-menu";
import { FileCheck } from "lucide-react";
import type { SubmissionStatus } from "@prisma/client";

const STATUS_VALUES = ["SUBMITTED", "LATE", "GRADED"] as const;
type StatusValue = (typeof STATUS_VALUES)[number];
const SORT_OPTIONS = ["recent", "name"] as const;
type SortBy = (typeof SORT_OPTIONS)[number];
const TYPE_OPTIONS = ["ALL", "INDIVIDUAL", "GROUP"] as const;
type TypeFilter = (typeof TYPE_OPTIONS)[number];

export default async function LecturerSubmissionsPage({
  searchParams,
}: {
  searchParams: {
    course?: string;
    assignment?: string;
    status?: string;
    sort?: string;
    type?: string;
  };
}) {
  const session = await auth();
  const lecturerId = session!.user.id;

  const courses = await getTaughtCourses(lecturerId);
  const courseCode = searchParams.course?.toUpperCase();
  const selectedCourse = courseCode ? courses.find((c) => c.code === courseCode) : null;
  const assignmentId = searchParams.assignment ? Number(searchParams.assignment) : undefined;
  // Status is multi-select: a comma-separated list in ?status=. Empty = all.
  const statuses: StatusValue[] = (searchParams.status ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is StatusValue => STATUS_VALUES.includes(s as StatusValue));
  const sort: SortBy = SORT_OPTIONS.includes(searchParams.sort as SortBy)
    ? (searchParams.sort as SortBy)
    : "recent";
  const typeFilter: TypeFilter = TYPE_OPTIONS.includes(searchParams.type as TypeFilter)
    ? (searchParams.type as TypeFilter)
    : "ALL";

  const submissions = await getLecturerSubmissions(lecturerId, {
    courseId: selectedCourse?.id,
    assignmentId,
    statuses: statuses as SubmissionStatus[],
    sort,
    assignmentType: typeFilter,
  });

  // When sorting by name, the server already groups them; pre-compute the
  // student-name header positions so the JSX can render dividers.
  const showStudentHeader = (idx: number) =>
    sort === "name" &&
    (idx === 0 ||
      submissions[idx - 1]?.student.name !== submissions[idx]?.student.name);

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

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-ukm-navy">{submissions.length}</span>{" "}
          penghantaran ditunjukkan
        </p>
        <FilterMenu
          courseCode={courseCode ?? null}
          assignmentId={assignmentId ?? null}
          statuses={statuses}
          type={typeFilter}
          sort={sort}
          courses={courses.map((c) => ({ code: c.code, title: c.title }))}
        />
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="Tiada penghantaran"
          description="Tiada penghantaran sepadan dengan tapisan anda."
          Icon={FileCheck}
        />
      ) : (
        <ul className="space-y-3">
          {submissions.map((s, idx) => (
            <li key={s.id} className="space-y-2">
              {showStudentHeader(idx) && (
                <h3 className="sticky top-16 z-10 -mx-1 rounded-md bg-gradient-to-r from-ukm-teal/15 to-transparent px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ukm-navy backdrop-blur">
                  {s.student.name}
                  {s.student.matricNum && (
                    <span className="ml-2 font-mono text-[10px] text-slate-500">
                      @{s.student.matricNum.toLowerCase()}
                    </span>
                  )}
                </h3>
              )}
              <div className="card">
                <GradingPanel
                  submission={{
                    id: s.id,
                    studentId: s.studentId,
                    studentName: s.student.name,
                    studentMatric: s.student.matricNum,
                    submittedBy: s.submittedBy
                      ? {
                          id: s.submittedBy.id,
                          name: s.submittedBy.name,
                          matricNum: s.submittedBy.matricNum,
                        }
                      : null,
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
