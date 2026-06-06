"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  GraduationCap,
  Search,
  UserMinus,
  UserPlus,
  Users2,
} from "lucide-react";
import { useToast } from "@/components/common/Toast";
import {
  assignCourseLecturer,
  bulkEnrollStudents,
  bulkUnenrollStudents,
} from "@/server/actions/admin-assignments";

type CourseRow = {
  id: number;
  code: string;
  title: string;
  lecturerId: number | null;
  lecturerName: string | null;
  enrollmentCount: number;
};

type StudentRow = {
  id: number;
  name: string;
  matricNum: string | null;
  faculty: string | null;
  program: string | null;
};

type LecturerRow = {
  id: number;
  name: string;
  matricNum: string | null;
};

export function AssignmentPanels({
  courses,
  students,
  lecturers,
  enrollmentMap,
}: {
  courses: CourseRow[];
  students: StudentRow[];
  lecturers: LecturerRow[];
  enrollmentMap: Record<number, number[]>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    courses[0]?.id ?? null,
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const enrolled = new Set(
    selectedCourseId ? enrollmentMap[selectedCourseId] ?? [] : [],
  );

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.matricNum?.toLowerCase().includes(q) ||
        s.program?.toLowerCase().includes(q) ||
        s.faculty?.toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  function toggle(id: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onEnroll() {
    if (!selectedCourseId || picked.size === 0) return;
    startTransition(async () => {
      const res = await bulkEnrollStudents({
        courseId: selectedCourseId,
        studentIds: [...picked],
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: `${res.data.added} pelajar didaftarkan.`,
      });
      setPicked(new Set());
      router.refresh();
    });
  }

  function onUnenroll() {
    if (!selectedCourseId || picked.size === 0) return;
    if (!confirm(`Keluarkan ${picked.size} pelajar dari kursus?`)) return;
    startTransition(async () => {
      const res = await bulkUnenrollStudents({
        courseId: selectedCourseId,
        studentIds: [...picked],
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: `${res.data.removed} pelajar dikeluarkan.`,
      });
      setPicked(new Set());
      router.refresh();
    });
  }

  function onAssignLecturer(lecturerId: number | null) {
    if (!selectedCourseId) return;
    startTransition(async () => {
      const res = await assignCourseLecturer({
        courseId: selectedCourseId,
        lecturerId,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: lecturerId
          ? "Pensyarah ditetapkan."
          : "Pensyarah dikeluarkan.",
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Course chooser */}
      <aside className="card overflow-hidden p-0">
        <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <h3 className="text-sm font-bold text-ukm-navy">Pilih Kursus</h3>
        </header>
        <ul className="max-h-[60vh] overflow-y-auto">
          {courses.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs italic text-slate-400">
              Tiada kursus.
            </li>
          ) : (
            courses.map((c) => {
              const active = c.id === selectedCourseId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setPicked(new Set());
                    }}
                    className={`flex w-full items-center justify-between gap-2 border-l-4 px-3 py-2.5 text-left transition ${
                      active
                        ? "border-ukm-orange bg-orange-50/60"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`font-mono text-xs font-bold ${
                          active ? "text-ukm-orange" : "text-ukm-navy"
                        }`}
                      >
                        {c.code}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {c.title}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {c.enrollmentCount}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {/* Right panel: lecturer assignment + student multi-select */}
      <div className="space-y-4">
        {selectedCourse && (
          <>
            {/* Lecturer assignment */}
            <section className="card">
              <header className="mb-3 flex items-center gap-2">
                <GraduationCap className="text-emerald-600" size={18} />
                <h3 className="text-sm font-bold text-ukm-navy">
                  Pensyarah {selectedCourse.code}
                </h3>
                {selectedCourse.lecturerName && (
                  <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Semasa: {selectedCourse.lecturerName}
                  </span>
                )}
              </header>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCourse.lecturerId ?? ""}
                  onChange={(e) =>
                    onAssignLecturer(e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={pending}
                  className="input-base max-w-md"
                >
                  <option value="">— Tiada pensyarah —</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.matricNum ? ` (${l.matricNum})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Student bulk assign */}
            <section className="card">
              <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-ukm-navy">
                    <Users2 className="text-purple-600" size={18} />
                    Pelajar {selectedCourse.code}
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                      {enrolled.size} daftar
                    </span>
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Tanda pelajar untuk daftar/keluarkan secara pukal.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onEnroll}
                    disabled={pending || picked.size === 0}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <UserPlus size={12} />
                    Daftar ({picked.size})
                  </button>
                  <button
                    type="button"
                    onClick={onUnenroll}
                    disabled={pending || picked.size === 0}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-ukm-red to-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <UserMinus size={12} />
                    Keluarkan ({picked.size})
                  </button>
                </div>
              </header>

              <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-ukm-teal focus-within:bg-white">
                <Search size={14} className="text-slate-400" />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari nama, matrik, program, fakulti…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                {picked.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setPicked(new Set())}
                    className="text-[11px] font-semibold text-slate-500 hover:text-ukm-navy"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              <ul className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                {filteredStudents.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs italic text-slate-400">
                    Tiada hasil.
                  </li>
                ) : (
                  filteredStudents.map((s) => {
                    const isEnrolled = enrolled.has(s.id);
                    const isPicked = picked.has(s.id);
                    return (
                      <li key={s.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 transition hover:bg-sky-50/60 ${
                            isPicked ? "bg-sky-50/80" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={() => toggle(s.id)}
                            className="h-4 w-4 rounded border-slate-300 text-ukm-teal"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ukm-navy">
                              {s.name}
                              {isEnrolled && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                  <Check size={9} />
                                  Daftar
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              <span className="font-mono">
                                {s.matricNum ?? "—"}
                              </span>
                              {s.program ? ` · ${s.program}` : ""}
                              {s.faculty ? ` · ${s.faculty}` : ""}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          </>
        )}

        {!selectedCourse && (
          <div className="card-elevated text-center text-sm italic text-slate-400">
            Pilih kursus di kiri untuk mula.
          </div>
        )}
      </div>
    </div>
  );
}
