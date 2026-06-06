"use client";

import { useRouter } from "next/navigation";

type CourseOption = { code: string; title: string };

type Props = {
  courseCode: string | null;
  assignmentId: number | null;
  statuses: string[];
  type: string;
  sort: string;
  courses: CourseOption[];
};

/**
 * Standalone course selector for the lecturer submissions page. Kept separate
 * from the filter dropdown. Changing it preserves the active status/type/sort
 * filters via the URL query.
 */
export function CourseSelect({
  courseCode,
  assignmentId,
  statuses,
  type,
  sort,
  courses,
}: Props) {
  const router = useRouter();

  function onChange(value: string) {
    const params = new URLSearchParams();
    if (value !== "ALL") params.set("course", value);
    if (assignmentId) params.set("assignment", String(assignmentId));
    if (statuses.length > 0) params.set("status", statuses.join(","));
    if (type !== "ALL") params.set("type", type);
    if (sort !== "recent") params.set("sort", sort);
    const qs = params.toString();
    router.push(`/lecturer/penghantaran${qs ? `?${qs}` : ""}`);
  }

  return (
    <select
      value={courseCode ?? "ALL"}
      onChange={(e) => onChange(e.target.value)}
      className="input-base max-w-xs"
      aria-label="Tapis mengikut kursus"
    >
      <option value="ALL">Semua kursus</option>
      {courses.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.title}
        </option>
      ))}
    </select>
  );
}
