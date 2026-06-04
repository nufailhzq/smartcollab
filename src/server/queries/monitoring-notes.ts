import { prisma } from "@/lib/prisma";

/**
 * Returns a map of studentId → note text for the given (lecturer, course).
 * Used by the lecturer monitoring page to hydrate the editable Catatan column.
 */
export async function getMonitoringNotesMap(
  lecturerId: number,
  courseId: number,
): Promise<Map<number, string>> {
  const rows = await prisma.monitoringNote.findMany({
    where: { lecturerId, courseId },
    select: { studentId: true, note: true },
  });
  return new Map(rows.map((r) => [r.studentId, r.note]));
}
