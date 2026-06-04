import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAssignmentForStudent } from "@/server/queries/submissions";
import { ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { SubmissionForm } from "./submission-form";
import { TrackAccess } from "@/components/dashboard/TrackAccess";

export default async function AssignmentDetailPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const session = await auth();
  const assignmentId = Number(params.assignmentId);
  if (!Number.isInteger(assignmentId) || assignmentId <= 0) notFound();

  const assignment = await getAssignmentForStudent(session!.user.id, assignmentId);
  if (!assignment) notFound();

  const sub = assignment.submissions[0] ?? null;
  const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isPast = due ? due < new Date() : false;

  const currentUserId = session!.user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TrackAccess
        type="ASSIGNMENT"
        refId={assignment.id}
        title={`${assignment.course.code}: ${assignment.title}`}
        link={`/student/tugasan/${assignment.id}`}
      />
      <Link
        href="/student/tugasan"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ukm-navy"
      >
        <ArrowLeft size={16} /> Kembali ke senarai tugasan
      </Link>

      <article className="card">
        <p className="font-mono text-xs uppercase tracking-wider text-ukm-orange">
          {assignment.course.code} · {assignment.course.title}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{assignment.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>{assignment.type === "GROUP" ? "Kumpulan" : "Individu"}</span>
          {due && (
            <span className={isPast && !sub ? "text-red-300" : ""}>
              Tarikh akhir: {formatDateTime(due)}
            </span>
          )}
          {assignment.maxGrade && <span>Markah maksimum: {assignment.maxGrade}</span>}
        </div>
        {assignment.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{assignment.description}</p>
        )}
      </article>

      <SubmissionForm
        assignmentId={assignment.id}
        isGroupAssignment={assignment.type === "GROUP"}
        currentUserId={currentUserId}
        existing={
          sub
            ? {
                id: sub.id,
                filePath: sub.filePath,
                grade: sub.grade,
                status: sub.status,
                submittedAt: sub.submittedAt,
                submittedBy: sub.submittedBy
                  ? {
                      id: sub.submittedBy.id,
                      name: sub.submittedBy.name,
                      matricNum: sub.submittedBy.matricNum,
                    }
                  : null,
                feedback: sub.feedback.map((f) => ({
                  id: f.id,
                  comment: f.comment,
                  lecturerName: f.lecturer.name,
                  createdAt: f.createdAt,
                })),
              }
            : null
        }
      />
    </div>
  );
}
