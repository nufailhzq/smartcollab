"use client";

import { useState, useTransition, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  Unlock,
  UserMinus,
  UserPlus,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { useToast } from "@/components/common/Toast";
import {
  assignStudentToGroup,
  createGroup,
  deleteGroup,
  removeStudentFromGroup,
  updateGroup,
} from "@/server/actions/lecturer-groups";
import { autoAssignUngrouped } from "@/server/actions/auto-assign";
import {
  approveAccessRequest,
  rejectAccessRequest,
  toggleCourseGroupsLocked,
} from "@/server/actions/group-access";

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

type PendingRequest = {
  id: number;
  type: "JOIN" | "LEAVE";
  reason: string | null;
  createdAt: string;
  student: { id: number; name: string; matricNum: string | null };
  group: { id: number; name: string };
};

type Props = {
  courseId: number;
  courseCode: string;
  groupsLocked: boolean;
  groups: Group[];
  ungroupedStudents: UngroupedStudent[];
  pendingRequests: PendingRequest[];
};

export function GroupManager({
  courseId,
  groupsLocked,
  groups,
  ungroupedStudents,
  pendingRequests,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);
  const [dropTargetId, setDropTargetId] = useState<number | "ungrouped" | null>(null);

  // Drag-and-drop helpers — payload encodes `{studentId, fromGroupId}`.
  const onDragStart = (e: DragEvent<HTMLLIElement>, studentId: number, fromGroupId: number | null) => {
    const payload = JSON.stringify({ studentId, fromGroupId });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.effectAllowed = "move";
  };
  const allowDrop = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDropOnGroup = (e: DragEvent, targetGroupId: number) => {
    e.preventDefault();
    setDropTargetId(null);
    try {
      const { studentId, fromGroupId } = JSON.parse(
        e.dataTransfer.getData("application/json") || "{}",
      ) as { studentId?: number; fromGroupId?: number | null };
      if (!studentId) return;
      if (fromGroupId === targetGroupId) return;
      startTransition(async () => {
        const res = await assignStudentToGroup({
          groupId: targetGroupId,
          studentId,
          role: "MEMBER",
        });
        if (!res.ok) return toast.push({ kind: "error", message: res.error });
        toast.push({ kind: "success", message: "Pelajar dipindah." });
        router.refresh();
      });
    } catch {
      /* malformed payload — ignore */
    }
  };
  const onDropOnUngrouped = (e: DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
    try {
      const { studentId, fromGroupId } = JSON.parse(
        e.dataTransfer.getData("application/json") || "{}",
      ) as { studentId?: number; fromGroupId?: number | null };
      if (!studentId || fromGroupId == null) return;
      startTransition(async () => {
        const res = await removeStudentFromGroup({ groupId: fromGroupId, studentId });
        if (!res.ok) return toast.push({ kind: "error", message: res.error });
        toast.push({ kind: "success", message: "Pelajar dikeluarkan." });
        router.refresh();
      });
    } catch {
      /* ignore */
    }
  };

  const onAutoAssign = () => {
    if (ungroupedStudents.length === 0) {
      toast.push({ kind: "success", message: "Semua pelajar sudah dalam kumpulan." });
      return;
    }
    if (
      !confirm(
        `Auto-tetapkan ${ungroupedStudents.length} pelajar belum berkumpulan ke dalam kumpulan secara seimbang? Pelajar sedia ada tidak akan dipindah.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await autoAssignUngrouped({
        courseId,
        createGroupsIfNeeded: true,
        defaultGroupSize: 5,
      });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      const { assignedCount, groupsCreated, ungroupedRemaining } = res.data;
      if (assignedCount === 0) {
        toast.push({
          kind: "success",
          message: "Tiada pelajar baharu untuk dikumpulkan.",
        });
      } else {
        toast.push({
          kind: "success",
          message: `${assignedCount} pelajar ditambah${
            groupsCreated > 0 ? `, ${groupsCreated} kumpulan baharu dicipta` : ""
          }${ungroupedRemaining > 0 ? `. ${ungroupedRemaining} masih belum dikumpulkan` : ""}.`,
        });
      }
      router.refresh();
    });
  };

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

  const onToggleLock = () => {
    const nextLocked = !groupsLocked;
    startTransition(async () => {
      const res = await toggleCourseGroupsLocked({ courseId, locked: nextLocked });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: nextLocked
          ? "Kumpulan dikunci. Pelajar perlu memohon kelulusan."
          : "Kumpulan dibuka. Pelajar boleh sertai atau keluar sendiri.",
      });
      router.refresh();
    });
  };

  const onApproveRequest = (requestId: number) => {
    startTransition(async () => {
      const res = await approveAccessRequest({ requestId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Permohonan diluluskan." });
      router.refresh();
    });
  };

  const onRejectRequest = (requestId: number) => {
    startTransition(async () => {
      const res = await rejectAccessRequest({ requestId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Permohonan ditolak." });
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
      {/* Lock toggle — locked = students must request, unlocked = free join/leave */}
      <div
        className={`card-elevated flex flex-wrap items-center justify-between gap-3 border-l-4 transition-colors duration-300 ${
          groupsLocked ? "border-amber-400 bg-amber-50/40" : "border-emerald-400 bg-emerald-50/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 ease-spring ${
              groupsLocked
                ? "rotate-0 bg-amber-100 text-amber-700"
                : "rotate-0 bg-emerald-100 text-emerald-700"
            }`}
          >
            {groupsLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-ukm-navy">
              {groupsLocked ? "Kumpulan Dikunci" : "Kumpulan Terbuka"}
            </p>
            <p className="text-[11px] text-slate-500">
              {groupsLocked
                ? "Pelajar perlu memohon kelulusan untuk sertai atau keluar."
                : "Pelajar boleh sertai dan keluar kumpulan secara terus."}
            </p>
          </div>
        </div>
        {/* Animated switch */}
        <button
          type="button"
          onClick={onToggleLock}
          disabled={pending}
          role="switch"
          aria-checked={groupsLocked}
          aria-label={groupsLocked ? "Buka kumpulan" : "Kunci kumpulan"}
          className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-spring focus:outline-none focus:ring-2 focus:ring-ukm-teal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            groupsLocked ? "bg-amber-500" : "bg-emerald-500"
          }`}
        >
          <span
            className={`flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-soft transition-transform duration-300 ease-spring ${
              groupsLocked ? "translate-x-9" : "translate-x-1"
            }`}
          >
            {pending ? (
              <Loader2 size={12} className="animate-spin text-slate-500" />
            ) : groupsLocked ? (
              <Lock size={12} className="text-amber-600" />
            ) : (
              <Unlock size={12} className="text-emerald-600" />
            )}
          </span>
        </button>
      </div>

      {/* Pending access requests — only shown when there are any */}
      {pendingRequests.length > 0 && (
        <div className="card-elevated animate-slide-up border-l-4 border-ukm-orange">
          <header className="mb-3 flex items-center gap-2">
            <Clock size={16} className="text-ukm-orange" />
            <h3 className="text-sm font-semibold text-ukm-navy">
              Permohonan Menunggu ({pendingRequests.length})
            </h3>
          </header>
          <ul className="space-y-2">
            {pendingRequests.map((r, idx) => {
              const isJoin = r.type === "JOIN";
              return (
                <li
                  key={r.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                        isJoin ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isJoin ? <LogIn size={16} /> : <LogOut size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ukm-navy">
                        {r.student.name}{" "}
                        <span className="font-normal text-slate-400">
                          ({r.student.matricNum ?? "—"})
                        </span>
                      </p>
                      <p className="truncate text-[11px] text-slate-600">
                        Mohon {isJoin ? "sertai" : "keluar"}{" "}
                        <span className="font-semibold">{r.group.name}</span>
                      </p>
                      {r.reason && (
                        <p className="mt-1 truncate text-[11px] italic text-slate-500">
                          “{r.reason}”
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onApproveRequest(r.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lift disabled:opacity-40"
                    >
                      <Check size={12} /> Lulus
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectRequest(r.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-ukm-red hover:text-ukm-red disabled:opacity-40"
                    >
                      <X size={12} /> Tolak
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="card-elevated">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-ukm-navy">
            <Plus size={18} className="text-ukm-orange" /> Cipta Kumpulan Baharu
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAutoAssign}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-ukm-teal to-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 size={14} /> Auto-Assign
              {ungroupedStudents.length > 0 && (
                <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
                  {ungroupedStudents.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? "Tutup" : "Tambah"}
            </button>
          </div>
        </header>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles size={11} className="text-ukm-teal" />
          Petua: Seret pelajar antara kumpulan untuk pindahkan secara terus.
        </p>
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
        <section
          className={`card lg:col-span-1 ${
            dropTargetId === "ungrouped" ? "ring-2 ring-ukm-teal/60 bg-sky-50/50" : ""
          }`}
          onDragOver={(e) => {
            allowDrop(e);
            setDropTargetId("ungrouped");
          }}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={onDropOnUngrouped}
        >
          <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-ukm-navy">
            <Users size={16} className="text-ukm-teal" /> Belum Berkumpulan ({ungroupedStudents.length})
          </header>
          {ungroupedStudents.length === 0 ? (
            <p className="text-xs italic text-slate-400">Semua pelajar sudah dalam kumpulan.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {ungroupedStudents.map((s, si) => (
                <li
                  key={s.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, s.id, null)}
                  style={{ animationDelay: `${si * 50}ms` }}
                  className="animate-slide-up cursor-grab rounded-lg border border-slate-200 bg-white p-2 transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:border-ukm-teal/40 hover:shadow-soft active:cursor-grabbing active:opacity-70"
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
              {groups.map((g, gi) => (
                <li
                  key={g.id}
                  onDragOver={(e) => {
                    allowDrop(e);
                    setDropTargetId(g.id);
                  }}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={(e) => onDropOnGroup(e, g.id)}
                  style={{ animationDelay: `${gi * 70}ms` }}
                  className={`card animate-slide-up transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-lift ${
                    dropTargetId === g.id ? "scale-[1.02] bg-sky-50/40 ring-2 ring-ukm-teal/60" : ""
                  }`}
                >
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
                      {g.members.map((m, mi) => (
                        <li
                          key={m.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, m.studentId, g.id)}
                          style={{ animationDelay: `${gi * 70 + mi * 40}ms` }}
                          className="flex animate-fade-in cursor-grab items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:border-ukm-teal/40 hover:bg-white hover:shadow-soft active:cursor-grabbing active:opacity-70"
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
