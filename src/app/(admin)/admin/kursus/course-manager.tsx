"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/server/actions/admin-courses";

type Lecturer = { id: number; name: string; matricNum: string | null };

type AdminCourseVM = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  semester: string | null;
  creditHours: number | null;
  lecturer: Lecturer | null;
  counts: { enrollments: number; assignments: number; groups: number; content: number };
};

type FormState = {
  code: string;
  title: string;
  description: string;
  semester: string;
  creditHours: number;
  lecturerId: number | null;
};

const blankForm: FormState = {
  code: "",
  title: "",
  description: "",
  semester: "",
  creditHours: 3,
  lecturerId: null,
};

type Props = {
  courses: AdminCourseVM[];
  lecturers: Lecturer[];
};

export function CourseManager({ courses, lecturers }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourseVM | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.lecturer?.name ?? "").toLowerCase().includes(q),
    );
  }, [courses, search]);

  const openCreate = () => {
    setForm(blankForm);
    setCreateOpen(true);
  };

  const openEdit = (c: AdminCourseVM) => {
    setForm({
      code: c.code,
      title: c.title,
      description: c.description ?? "",
      semester: c.semester ?? "",
      creditHours: c.creditHours ?? 3,
      lecturerId: c.lecturer?.id ?? null,
    });
    setEditing(c);
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCourse({
        code: form.code,
        title: form.title,
        description: form.description,
        semester: form.semester,
        creditHours: form.creditHours,
        lecturerId: form.lecturerId,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kursus dicipta." });
      setCreateOpen(false);
      setForm(blankForm);
      router.refresh();
    });
  };

  const onUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const res = await updateCourse({
        courseId: editing.id,
        code: form.code,
        title: form.title,
        description: form.description,
        semester: form.semester,
        creditHours: form.creditHours,
        lecturerId: form.lecturerId,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kursus dikemaskini." });
      setEditing(null);
      router.refresh();
    });
  };

  const onDelete = (c: AdminCourseVM) => {
    const cascadeWarning =
      c.counts.enrollments + c.counts.assignments + c.counts.groups + c.counts.content > 0
        ? ` Ini akan turut memadam ${c.counts.enrollments} pendaftaran, ${c.counts.assignments} tugasan, ${c.counts.groups} kumpulan, dan ${c.counts.content} kandungan.`
        : "";
    if (!confirm(`Padam ${c.code} — ${c.title}?${cascadeWarning}`)) return;
    startTransition(async () => {
      const res = await deleteCourse({ courseId: c.id });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kursus dipadam." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="card-elevated">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Cari</label>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kod, tajuk, atau nama pensyarah"
                className="input-base pl-9"
              />
            </div>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary gap-2">
            <Plus size={16} /> Tambah Kursus
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={courses.length === 0 ? "Belum ada kursus" : "Tiada kursus sepadan"}
          description={
            courses.length === 0
              ? "Cipta kursus pertama anda untuk mengisi katalog."
              : "Cuba carian lain."
          }
          Icon={BookOpen}
          action={
            <button type="button" onClick={openCreate} className="btn-primary gap-2">
              <Plus size={14} /> Tambah Kursus
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3">Tajuk</th>
                  <th className="px-4 py-3">Pensyarah</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Kredit</th>
                  <th className="px-4 py-3">Aktiviti</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ukm-orange">
                      {c.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ukm-navy">{c.title}</p>
                      {c.description && (
                        <p className="line-clamp-1 text-xs text-slate-500">{c.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.lecturer ? (
                        <>
                          <p className="text-sm font-medium text-ukm-navy">{c.lecturer.name}</p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {c.lecturer.matricNum}
                          </p>
                        </>
                      ) : (
                        <span className="italic text-slate-400">Tidak ditetapkan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.semester ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.creditHours ?? "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      <p>
                        {c.counts.enrollments} pelajar · {c.counts.groups} kumpulan
                      </p>
                      <p>
                        {c.counts.assignments} tugasan · {c.counts.content} kandungan
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Kemaskini"
                          onClick={() => openEdit(c)}
                          disabled={pending}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy disabled:opacity-40"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Padam"
                          onClick={() => onDelete(c)}
                          disabled={pending}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-ukm-red disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tambah Kursus">
        <CourseForm
          form={form}
          setForm={setForm}
          lecturers={lecturers}
          pending={pending}
          submitLabel="Cipta"
          onSubmit={onCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Kemaskini: ${editing.code}` : "Kemaskini"}
      >
        <CourseForm
          form={form}
          setForm={setForm}
          lecturers={lecturers}
          pending={pending}
          submitLabel="Simpan"
          onSubmit={onUpdate}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </div>
  );
}

function CourseForm({
  form,
  setForm,
  lecturers,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  lecturers: Lecturer[];
  pending: boolean;
  submitLabel: string;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kod kursus" required>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
            maxLength={20}
            className="input-base font-mono"
          />
        </Field>
        <Field label="Kredit">
          <input
            type="number"
            value={form.creditHours}
            onChange={(e) => setForm({ ...form, creditHours: Number(e.target.value) })}
            min={0}
            max={10}
            className="input-base"
          />
        </Field>
        <Field label="Tajuk" required>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            maxLength={160}
            className="input-base sm:col-span-2"
          />
        </Field>
        <Field label="Semester">
          <input
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            maxLength={40}
            placeholder="Sem 1 26/27"
            className="input-base"
          />
        </Field>
        <Field label="Pensyarah">
          <select
            value={form.lecturerId ?? ""}
            onChange={(e) =>
              setForm({ ...form, lecturerId: e.target.value ? Number(e.target.value) : null })
            }
            className="input-base"
          >
            <option value="">— Tiada pensyarah —</option>
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.matricNum})
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Penerangan">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={2000}
          rows={3}
          className="input-base resize-none"
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ukm-navy">
        {label} {required && <span className="text-ukm-red">*</span>}
      </label>
      {children}
    </div>
  );
}
