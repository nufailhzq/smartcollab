import { prisma } from "@/lib/prisma";
import { rowsFor } from "@/lib/recipients";
import type { Role } from "@prisma/client";
import type { Assignment, Submission } from "@prisma/client";

/**
 * The four — and only four — completion states. There is deliberately no
 * "in progress": that state is undetectable without an explicit student action
 * to drive it, so it would be ambiguous and gameable. Completion is DERIVED on
 * read from submission + due date (see classify), never stored, so there is a
 * single source of truth and no status column to drift out of sync.
 */
export type CompletionStatus = "NOT_STARTED" | "SUBMITTED" | "LATE" | "GRADED";

/**
 * The 4-state rule, resolved in priority order. Uses Submission.submittedAt
 * (the model has no createdAt) and treats a null dueDate as "never late".
 */
export function classify(
  submission: Pick<Submission, "grade" | "submittedAt"> | null,
  assignment: Pick<Assignment, "dueDate">,
): CompletionStatus {
  if (!submission) return "NOT_STARTED";
  if (submission.grade !== null) return "GRADED";
  if (assignment.dueDate && submission.submittedAt > assignment.dueDate) {
    return "LATE";
  }
  return "SUBMITTED";
}

export type ProgressAssignment = {
  id: number;
  title: string;
  dueDate: string | null;
  groupingMode: Assignment["groupingMode"];
};

export type ProgressRow = {
  /** Stable key, e.g. "group:12" or "student:7". */
  key: string;
  id: number;
  label: string;
  isGroup: boolean;
  /** Status per assignment id. A missing key = the row doesn't participate. */
  cells: Record<number, CompletionStatus>;
};

export type CourseProgress = {
  assignments: ProgressAssignment[];
  rows: ProgressRow[];
};

export class ProgressAuthError extends Error {}

/**
 * Build the completion grid for a course.
 *
 * Rows are resolved per assignment's grouping mode via rowsFor (which shares
 * its membership logic with recipientsFor, so the denominator can't drift).
 * Because grouping mode is per assignment, a row identity is global: a standing
 * group or ad-hoc group (group:<id>) or an individual student (student:<id>).
 * A row only carries a cell for assignments it actually participates in.
 *
 * Submissions are batch-loaded once for the whole course and mapped in memory
 * (no N+1). A group's cell is the "best" status among its members' submissions
 * for that assignment (GRADED > SUBMITTED > LATE > NOT_STARTED), so a group that
 * has submitted shows submitted even if only one member's row carries it.
 */
export async function getCourseProgress(
  courseId: number,
  viewerUserId: number,
  viewerRole: Role,
): Promise<CourseProgress> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, lecturerId: true },
  });
  if (!course) throw new ProgressAuthError("Kursus tidak wujud.");

  // Auth: a lecturer may only view a course they teach; a student must be
  // enrolled. Anyone else is unauthorized.
  if (viewerRole === "LECTURER") {
    if (course.lecturerId !== viewerUserId) {
      throw new ProgressAuthError("Anda bukan pensyarah kursus ini.");
    }
  } else if (viewerRole === "STUDENT") {
    const enrolled = await prisma.classEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: viewerUserId } },
    });
    if (!enrolled) throw new ProgressAuthError("Anda tidak berdaftar dalam kursus ini.");
  } else {
    throw new ProgressAuthError("Tidak dibenarkan.");
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    orderBy: { dueDate: "asc" },
  });

  // Batch-load every submission for the course's assignments once.
  const assignmentIds = assignments.map((a) => a.id);
  const submissions =
    assignmentIds.length === 0
      ? []
      : await prisma.submission.findMany({
          where: { assignmentId: { in: assignmentIds } },
          select: { assignmentId: true, studentId: true, grade: true, submittedAt: true },
        });
  // (assignmentId -> studentId -> submission) for O(1) lookup.
  const byAssignment = new Map<number, Map<number, (typeof submissions)[number]>>();
  for (const s of submissions) {
    let inner = byAssignment.get(s.assignmentId);
    if (!inner) byAssignment.set(s.assignmentId, (inner = new Map()));
    inner.set(s.studentId, s);
  }

  const RANK: Record<CompletionStatus, number> = {
    NOT_STARTED: 0,
    LATE: 1,
    SUBMITTED: 2,
    GRADED: 3,
  };

  // Accumulate rows by stable key across all assignment columns.
  const rowMap = new Map<string, ProgressRow>();

  for (const assignment of assignments) {
    const rows = await rowsFor(assignment);
    const subForAssignment = byAssignment.get(assignment.id);

    for (const r of rows) {
      const key = `${r.isGroup ? "group" : "student"}:${r.id}`;
      let row = rowMap.get(key);
      if (!row) {
        row = { key, id: r.id, label: r.label, isGroup: r.isGroup, cells: {} };
        rowMap.set(key, row);
      }

      // A group's status = the best status among its members' submissions.
      let best: CompletionStatus = "NOT_STARTED";
      for (const studentId of r.memberIds) {
        const status = classify(subForAssignment?.get(studentId) ?? null, assignment);
        if (RANK[status] > RANK[best]) best = status;
      }
      row.cells[assignment.id] = best;
    }
  }

  let rows = Array.from(rowMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  // Student privacy: students see only the row(s) that include them — their own
  // group (or themselves for INDIVIDUAL assignments). They never see other
  // groups' completion status.
  if (viewerRole === "STUDENT") {
    const myGroupIds = new Set(
      (
        await prisma.groupMember.findMany({
          where: { studentId: viewerUserId, group: { courseId } },
          select: { groupId: true },
        })
      ).map((m) => m.groupId),
    );
    rows = rows.filter(
      (r) =>
        (r.isGroup && myGroupIds.has(r.id)) ||
        (!r.isGroup && r.id === viewerUserId),
    );
  }

  return {
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      groupingMode: a.groupingMode,
    })),
    rows,
  };
}
