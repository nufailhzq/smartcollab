"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  toggleUserActive,
  updateUser,
} from "@/server/actions/admin-users";

type Role = "STUDENT" | "LECTURER" | "ADMIN";

type AdminUserVM = {
  id: number;
  name: string;
  email: string | null;
  role: Role;
  matricNum: string | null;
  faculty: string | null;
  isActive: boolean;
  createdAt: string;
  counts: { enrollments: number; taughtCourses: number; submissions: number };
};

type Filters = {
  role: "ALL" | Role;
  active: "ALL" | "ACTIVE" | "INACTIVE";
  search: string;
};

type Props = {
  users: AdminUserVM[];
  filters: Filters;
};

const ROLE_BADGE: Record<Role, string> = {
  STUDENT: "bg-sky-100 text-sky-700",
  LECTURER: "bg-violet-100 text-violet-700",
  ADMIN: "bg-amber-100 text-amber-700",
};

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Pelajar",
  LECTURER: "Pensyarah",
  ADMIN: "Pentadbir",
};

type FormState = {
  name: string;
  email: string;
  role: Role;
  matricNum: string;
  faculty: string;
  isActive: boolean;
  password: string;
};

const blankForm: FormState = {
  name: "",
  email: "",
  role: "STUDENT",
  matricNum: "",
  faculty: "FTSM",
  isActive: true,
  password: "",
};

export function UserManager({ users, filters }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserVM | null>(null);
  const [resetting, setResetting] = useState<AdminUserVM | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [resetPw, setResetPw] = useState("");

  const counts = useMemo(() => {
    const c = { total: users.length, student: 0, lecturer: 0, admin: 0, inactive: 0 };
    for (const u of users) {
      if (u.role === "STUDENT") c.student++;
      else if (u.role === "LECTURER") c.lecturer++;
      else c.admin++;
      if (!u.isActive) c.inactive++;
    }
    return c;
  }, [users]);

  const updateFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    if (next.role !== "ALL") params.set("role", next.role);
    if (next.active !== "ALL") params.set("active", next.active);
    if (next.search.trim()) params.set("q", next.search.trim());
    const qs = params.toString();
    router.push(qs ? `/admin/pengguna?${qs}` : "/admin/pengguna");
  };

  const openCreate = () => {
    setForm(blankForm);
    setCreateOpen(true);
  };

  const openEdit = (u: AdminUserVM) => {
    setForm({
      name: u.name,
      email: u.email ?? "",
      role: u.role,
      matricNum: u.matricNum ?? "",
      faculty: u.faculty ?? "FTSM",
      isActive: u.isActive,
      password: "",
    });
    setEditing(u);
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUser({
        name: form.name,
        email: form.email,
        role: form.role,
        matricNum: form.matricNum,
        faculty: form.faculty,
        isActive: form.isActive,
        password: form.password,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Pengguna dicipta." });
      setCreateOpen(false);
      setForm(blankForm);
      router.refresh();
    });
  };

  const onUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const res = await updateUser({
        userId: editing.id,
        name: form.name,
        email: form.email,
        role: form.role,
        matricNum: form.matricNum,
        faculty: form.faculty,
        isActive: form.isActive,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Pengguna dikemaskini." });
      setEditing(null);
      router.refresh();
    });
  };

  const onToggleActive = (u: AdminUserVM) => {
    startTransition(async () => {
      const res = await toggleUserActive({ userId: u.id, isActive: !u.isActive });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: u.isActive ? "Dinyahaktifkan." : "Diaktifkan." });
      router.refresh();
    });
  };

  const onDelete = (u: AdminUserVM) => {
    if (!confirm(`Padam ${u.name}? Tindakan ini tidak boleh dipulihkan.`)) return;
    startTransition(async () => {
      const res = await deleteUser({ userId: u.id });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Pengguna dipadam." });
      router.refresh();
    });
  };

  const onResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!resetting) return;
    startTransition(async () => {
      const res = await resetUserPassword({ userId: resetting.id, password: resetPw });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kata laluan dikemaskini." });
      setResetting(null);
      setResetPw("");
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatChip label="Jumlah" value={counts.total} />
        <StatChip label="Pelajar" value={counts.student} />
        <StatChip label="Pensyarah" value={counts.lecturer} />
        <StatChip label="Nyahaktif" value={counts.inactive} accent="amber" />
      </div>

      <div className="card-elevated">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Cari</label>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                defaultValue={filters.search}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateFilter({ search: e.currentTarget.value });
                }}
                onBlur={(e) => {
                  if (e.currentTarget.value !== filters.search) {
                    updateFilter({ search: e.currentTarget.value });
                  }
                }}
                placeholder="Nama, e-mel, atau no. matrik"
                className="input-base pl-9"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Peranan</label>
            <select
              value={filters.role}
              onChange={(e) => updateFilter({ role: e.target.value as Filters["role"] })}
              className="input-base"
            >
              <option value="ALL">Semua</option>
              <option value="STUDENT">Pelajar</option>
              <option value="LECTURER">Pensyarah</option>
              <option value="ADMIN">Pentadbir</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">Status</label>
            <select
              value={filters.active}
              onChange={(e) => updateFilter({ active: e.target.value as Filters["active"] })}
              className="input-base"
            >
              <option value="ALL">Semua</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nyahaktif</option>
            </select>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary gap-2">
            <UserPlus size={16} /> Tambah Pengguna
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="Tiada pengguna sepadan"
          description="Cuba ubah penapis atau tambah pengguna baharu."
          Icon={UserPlus}
          action={
            <button type="button" onClick={openCreate} className="btn-primary gap-2">
              <Plus size={14} /> Tambah Pengguna
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Matrik</th>
                  <th className="px-4 py-3">E-mel</th>
                  <th className="px-4 py-3">Peranan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aktiviti</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-ukm-navy">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {u.matricNum ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          u.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {u.isActive ? "Aktif" : "Nyahaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.role === "LECTURER"
                        ? `${u.counts.taughtCourses} kursus diajar`
                        : u.role === "STUDENT"
                          ? `${u.counts.enrollments} kursus · ${u.counts.submissions} penghantaran`
                          : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn
                          title="Kemaskini"
                          onClick={() => openEdit(u)}
                          disabled={pending}
                        >
                          <Pencil size={14} />
                        </IconBtn>
                        <IconBtn
                          title="Tukar kata laluan"
                          onClick={() => {
                            setResetting(u);
                            setResetPw("");
                          }}
                          disabled={pending}
                        >
                          <KeyRound size={14} />
                        </IconBtn>
                        <IconBtn
                          title={u.isActive ? "Nyahaktif" : "Aktifkan"}
                          onClick={() => onToggleActive(u)}
                          disabled={pending}
                          tone={u.isActive ? "warn" : "ok"}
                        >
                          <Power size={14} />
                        </IconBtn>
                        <IconBtn
                          title="Padam"
                          onClick={() => onDelete(u)}
                          disabled={pending}
                          tone="danger"
                        >
                          <Trash2 size={14} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Pengguna"
      >
        <UserForm
          form={form}
          setForm={setForm}
          mode="create"
          pending={pending}
          onSubmit={onCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Kemaskini: ${editing.name}` : "Kemaskini"}
      >
        <UserForm
          form={form}
          setForm={setForm}
          mode="update"
          pending={pending}
          onSubmit={onUpdate}
          onCancel={() => setEditing(null)}
        />
      </Modal>

      <Modal
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title={resetting ? `Kata laluan baharu untuk ${resetting.name}` : "Tukar kata laluan"}
      >
        <form onSubmit={onResetSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Kata laluan baharu
            </label>
            <input
              type="text"
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
              minLength={4}
              maxLength={120}
              required
              autoFocus
              className="input-base font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Minimum 4 aksara. Akan di-hash dengan bcrypt sebelum disimpan.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetting(null)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent = "navy",
}: {
  label: string;
  value: number;
  accent?: "navy" | "amber";
}) {
  return (
    <div className="card flex items-center justify-between py-3">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
          accent === "amber" ? "text-amber-600" : "text-ukm-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  tone?: "neutral" | "danger" | "warn" | "ok";
}) {
  const toneCls =
    tone === "danger"
      ? "hover:bg-red-50 hover:text-ukm-red"
      : tone === "warn"
        ? "hover:bg-amber-50 hover:text-amber-700"
        : tone === "ok"
          ? "hover:bg-emerald-50 hover:text-emerald-700"
          : "hover:bg-slate-100 hover:text-ukm-navy";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded p-1.5 text-slate-500 transition disabled:opacity-40 ${toneCls}`}
    >
      {children}
    </button>
  );
}

function UserForm({
  form,
  setForm,
  mode,
  pending,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  mode: "create" | "update";
  pending: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama penuh" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={120}
            className="input-base"
          />
        </Field>
        <Field label="No. matrik" required>
          <input
            value={form.matricNum}
            onChange={(e) => setForm({ ...form, matricNum: e.target.value.toUpperCase() })}
            required
            maxLength={32}
            className="input-base font-mono"
          />
        </Field>
        <Field label="E-mel">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={160}
            className="input-base"
          />
        </Field>
        <Field label="Fakulti">
          <input
            value={form.faculty}
            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            maxLength={40}
            className="input-base"
          />
        </Field>
        <Field label="Peranan" required>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="input-base"
          >
            <option value="STUDENT">Pelajar</option>
            <option value="LECTURER">Pensyarah</option>
            <option value="ADMIN">Pentadbir</option>
          </select>
        </Field>
        <Field label="Status">
          <label className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span className="text-sm text-slate-600">Akaun aktif</span>
          </label>
        </Field>
        {mode === "create" && (
          <Field label="Kata laluan permulaan" required>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={4}
              maxLength={120}
              className="input-base font-mono"
            />
          </Field>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {mode === "create" ? "Cipta" : "Simpan"}
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
