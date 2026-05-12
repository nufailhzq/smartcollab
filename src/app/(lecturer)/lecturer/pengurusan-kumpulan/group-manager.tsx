"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import {
  assignStudentToGroup,
  createGroup,
  deleteGroup,
  removeStudentFromGroup,
  updateGroup,
} from "@/server/actions/lecturer-groups";

type Member = {
  id: number;
  studentId: number;
  name: string;
  matricNum: string | null;
  role: "LEADER" | "MEMBER";
};

type Group = {
  id: number;
  name: string;
  maxMembers: number;
  memberCount: number;
  members: Member[];
};

type UngroupedStudent = { id: number; name: string; matricNum: string | null };

type Props = {
  courseId: number;
  courseCode: string;
  groups: Group[];
  ungroupedStudents: UngroupedStudent[];
};

export function GroupManager({ courseId, groups, ungroupedStudents }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createGroup({ courseId, name, maxMembers });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kumpulan dicipta." });
      setName("");
      setMaxMembers(5);
      setShowCreate(false);
      router.refresh();
    });
  };

  const onAssign = (groupId: number, studentId: number) => {
    startTransition(async () => {
      const res = await assignStudentToGroup({ groupId, studentId, role: "MEMBER" });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Pelajar ditambah." });
      router.refresh();
    });
  };

  const onRemove = (groupId: number, studentId: number) => {
    startTransition(async () => {
      const res = await removeStudentFromGroup({ groupId, studentId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Pelajar dikeluarkan." });
      router.refresh();
    });
  };

  const onDeleteGroup = (groupId: number) => {
    if (!confirm("Padam kumpulan ini? Semua ahli akan dikeluarkan.")) return;
    startTransition(async () => {
      const res = await deleteGroup({ groupId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kumpulan dipadam." });
      router.refresh();
    });
  };

  const onRename = (group: Group) => {
    const newName = prompt("Nama baharu:", group.name);
    if (!newName || newName.trim() === group.name) return;
    const newMax = Number(prompt("Saiz maksimum:", String(group.maxMembers)) ?? group.maxMembers);
    startTransition(async () => {
      const res = await updateGroup({
        groupId: group.id,
        name: newName.trim(),
        maxMembers: newMax,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Kumpulan dikemaskini." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="card-elevated">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ukm-navy">
            <Plus size={18} className="text-ukm-orange" /> Cipta Kumpulan Baharu
          </div>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Tutup" : "Tambah"}
          </button>
        </header>
        {showCreate && (
          <form
            onSubmit={onCreate}
            className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">Nama Kumpulan</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="Kumpulan Alpha"
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">Saiz Max</label>
              <input
                type="number"
                min={2}
                max={10}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="input-base"
              />
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              Cipta
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-ukm-navy">
            <Users size={16} className="text-ukm-teal" /> Belum Berkumpulan ({ungroupedStudents.length})
          </header>
          {ungroupedStudents.length === 0 ? (
            <p className="text-xs italic text-slate-400">Semua pelajar sudah dalam kumpulan.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {ungroupedStudents.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-slate-200 bg-white p-2"
                >
                  <p className="font-medium text-ukm-navy">{s.name}</p>
                  <p className="font-mono text-[11px] text-slate-500">{s.matricNum ?? "—"}</p>
                  {groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {groups
                        .filter((g) => g.memberCount < g.maxMembers)
                        .map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            disabled={pending}
                            onClick={() => onAssign(g.id, s.id)}
                            className="rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-ukm-orange hover:bg-orange-200 disabled:opacity-40"
                          >
                            → {g.name}
                          </button>
                        ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2">
          {groups.length === 0 ? (
            <div className="card text-center text-sm text-slate-500">
              Tiada kumpulan dalam kursus ini. Cipta yang pertama di atas.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {groups.map((g) => (
                <li key={g.id} className="card">
                  <header className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onRename(g)}
                      className="text-left font-semibold text-ukm-navy hover:underline"
                    >
                      {g.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          g.memberCount >= g.maxMembers
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {g.memberCount}/{g.maxMembers}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteGroup(g.id)}
                        disabled={pending}
                        title="Padam kumpulan"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-ukm-red"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </header>
                  {g.members.length === 0 ? (
                    <p className="text-xs italic text-slate-400">Tiada ahli.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {g.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ukm-navy">{m.name}</p>
                            <p className="font-mono text-[11px] text-slate-500">{m.matricNum}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(g.id, m.studentId)}
                            disabled={pending}
                            title="Keluarkan"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-ukm-red"
                          >
                            <UserMinus size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {g.memberCount < g.maxMembers && ungroupedStudents.length > 0 && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-slate-500 hover:text-ukm-navy">
                        + Tambah pelajar
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {ungroupedStudents.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => onAssign(g.id, s.id)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-sky-50"
                            >
                              <UserPlus size={12} className="text-ukm-teal" />
                              <span className="font-medium text-ukm-navy">{s.name}</span>
                              <span className="ml-auto font-mono text-[11px] text-slate-500">
                                {s.matricNum}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
