"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListFilter, ChevronDown } from "lucide-react";

const STATUS_ITEMS = [
  { value: "SUBMITTED", label: "Dihantar" },
  { value: "LATE", label: "Lewat" },
  { value: "GRADED", label: "Dimarkah" },
] as const;

const TYPE_ITEMS = [
  { value: "ALL", label: "Semua" },
  { value: "INDIVIDUAL", label: "🧑 Individu" },
  { value: "GROUP", label: "👥 Kumpulan" },
] as const;

const SORT_ITEMS = [
  { value: "recent", label: "Terbaru" },
  { value: "name", label: "Nama Pelajar" },
] as const;

type StatusValue = (typeof STATUS_ITEMS)[number]["value"];
type TypeValue = (typeof TYPE_ITEMS)[number]["value"];
type SortValue = (typeof SORT_ITEMS)[number]["value"];

type CourseOption = { code: string; title: string };

type Props = {
  courseCode: string | null;
  assignmentId: number | null;
  statuses: StatusValue[];
  type: TypeValue;
  sort: SortValue;
  courses: CourseOption[];
};

/**
 * Single consolidated filter dropdown for the lecturer submissions page.
 * Status is multi-select (tick several at once); Jenis and Susun are single
 * choice. Each change pushes a new URL so the server re-queries.
 */
export function FilterMenu({
  courseCode,
  assignmentId,
  statuses,
  type,
  sort,
  courses,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function navigate(next: {
    course?: string | null;
    statuses?: StatusValue[];
    type?: TypeValue;
    sort?: SortValue;
  }) {
    const nextCourse = next.course !== undefined ? next.course : courseCode;
    const nextStatuses = next.statuses ?? statuses;
    const nextType = next.type ?? type;
    const nextSort = next.sort ?? sort;

    const params = new URLSearchParams();
    if (nextCourse) params.set("course", nextCourse);
    if (assignmentId) params.set("assignment", String(assignmentId));
    if (nextStatuses.length > 0) params.set("status", nextStatuses.join(","));
    if (nextType !== "ALL") params.set("type", nextType);
    if (nextSort !== "recent") params.set("sort", nextSort);
    const qs = params.toString();
    router.push(`/lecturer/penghantaran${qs ? `?${qs}` : ""}`);
  }

  function toggleStatus(v: StatusValue) {
    const set = new Set(statuses);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    navigate({ statuses: [...set] });
  }

  // Count of active (non-default) filters for the button badge.
  const activeCount =
    (courseCode ? 1 : 0) +
    statuses.length +
    (type !== "ALL" ? 1 : 0) +
    (sort !== "recent" ? 1 : 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
          activeCount > 0
            ? "border-ukm-teal bg-sky-50 text-ukm-teal"
            : "border-slate-200 bg-white text-slate-600 hover:border-ukm-teal hover:bg-sky-50"
        }`}
      >
        <ListFilter size={14} />
        Tapis
        {activeCount > 0 && (
          <span className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ukm-teal px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift-lg animate-fade-in">
          <Section title="Kursus">
            <li className="px-3 pb-2 pt-0.5">
              <select
                value={courseCode ?? "ALL"}
                onChange={(e) =>
                  navigate({ course: e.target.value === "ALL" ? null : e.target.value })
                }
                className="input-base w-full text-xs"
              >
                <option value="ALL">Semua kursus</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </li>
          </Section>

          <Section title="Status">
            {STATUS_ITEMS.map((it) => (
              <Row
                key={it.value}
                label={it.label}
                checked={statuses.includes(it.value)}
                onClick={() => toggleStatus(it.value)}
              />
            ))}
          </Section>

          <Section title="Jenis">
            {TYPE_ITEMS.map((it) => (
              <Row
                key={it.value}
                label={it.label}
                checked={type === it.value}
                radio
                onClick={() => navigate({ type: it.value })}
              />
            ))}
          </Section>

          <Section title="Susun">
            {SORT_ITEMS.map((it) => (
              <Row
                key={it.value}
                label={it.label}
                checked={sort === it.value}
                radio
                onClick={() => navigate({ sort: it.value })}
              />
            ))}
          </Section>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate({ course: null, statuses: [], type: "ALL", sort: "recent" })
              }
              className="w-full border-t border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-ukm-red hover:bg-red-50"
            >
              Set semula tapisan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <ul className="pb-1">{children}</ul>
    </div>
  );
}

function Row({
  label,
  checked,
  radio = false,
  onClick,
}: {
  label: string;
  checked: boolean;
  radio?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 transition hover:bg-sky-50"
      >
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center border ${
            radio ? "rounded-full" : "rounded"
          } ${
            checked
              ? "border-ukm-teal bg-ukm-teal text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {checked && <Check size={11} strokeWidth={3} />}
        </span>
        <span className={checked ? "font-semibold text-ukm-navy" : ""}>{label}</span>
      </button>
    </li>
  );
}
