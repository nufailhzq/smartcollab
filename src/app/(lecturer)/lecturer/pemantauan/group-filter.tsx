"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

// Group dropdown for Progress Monitoring. Navigates with ?course=&group= so the
// server re-renders the table filtered to the chosen group. "" = all students.
export function GroupFilter({
  courseCode,
  groups,
  hasUngrouped,
  selected,
}: {
  courseCode: string;
  groups: string[];
  hasUngrouped: boolean;
  selected: string | null;
}) {
  const router = useRouter();

  function onChange(value: string) {
    const params = new URLSearchParams();
    params.set("course", courseCode);
    if (value) params.set("group", value);
    router.push(`/lecturer/pemantauan?${params.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <Users size={16} className="text-ukm-teal" />
      <span className="text-slate-600">Kumpulan:</span>
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="input-base max-w-[220px] py-1.5 text-sm"
      >
        <option value="">Semua pelajar</option>
        {groups.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
        {hasUngrouped && <option value="__none__">Tiada kumpulan</option>}
      </select>
    </label>
  );
}
