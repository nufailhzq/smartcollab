"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

// Tugasan (assignment) dropdown for Progress Monitoring. Navigates with
// ?course=&group=&tugasan= so the server re-renders the contribution signal
// scoped to one group assignment. "" = Semua (summed across all tugasan).
export function TugasanFilter({
  courseCode,
  selectedGroup,
  tugasan,
  selected,
}: {
  courseCode: string;
  selectedGroup: string | null;
  tugasan: { id: number; title: string }[];
  selected: number | null;
}) {
  const router = useRouter();

  function onChange(value: string) {
    const params = new URLSearchParams();
    params.set("course", courseCode);
    if (selectedGroup) params.set("group", selectedGroup);
    if (value) params.set("tugasan", value);
    router.push(`/lecturer/pemantauan?${params.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <ClipboardList size={16} className="text-ukm-teal" />
      <span className="text-slate-600">Tugasan:</span>
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="input-base max-w-[260px] py-1.5 text-sm"
      >
        <option value="">Semua (terkumpul)</option>
        {tugasan.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
    </label>
  );
}
