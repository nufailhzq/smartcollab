"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Course = { code: string; title: string; lecturer: { name: string } | null };

type Props = {
  courses: Course[];
  selectedCode: string;
  filterType: "all" | "INDIVIDUAL" | "GROUP";
};

export function CourseFilterDropdown({ courses, selectedCode, filterType }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onChange = (value: string) => {
    const params = new URLSearchParams();
    if (value !== "ALL") params.set("course", value);
    if (filterType !== "all") params.set("type", filterType);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/student/tugasan?${qs}` : "/student/tugasan");
    });
  };

  return (
    <select
      id="course-filter"
      name="course"
      value={selectedCode}
      onChange={(e) => onChange(e.target.value)}
      disabled={pending}
      className="input-base disabled:opacity-60"
    >
      <option value="ALL">Semua kursus</option>
      {courses.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.title}
          {c.lecturer ? ` (${c.lecturer.name})` : ""}
        </option>
      ))}
    </select>
  );
}
