"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Crown,
  Grid,
  Lock,
  LogOut,
  MessageCircle,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { useToast } from "@/components/common/Toast";
import { joinGroup, leaveGroup } from "@/server/actions/groups";
import {
  cancelAccessRequest,
  requestJoinGroup,
  requestLeaveGroup,
} from "@/server/actions/group-access";
import { ensureProjectGroupChat } from "@/server/actions/group-chat";

type Member = {
  studentId: number;
  name: string;
  matricNum: string | null;
  role: "LEADER" | "MEMBER";
  contributionPct: number;
  submitted: number;
  totalAssignments: number;
  lastActivityAt: string | null;
  avatarPath?: string | null;
};

type CurrentGroup = {
  id: number;
  name: string;
  maxMembers: number;
  memberCount: number;
  members: Member[];
};

type OtherGroup = {
  id: number;
  name: string;
  maxMembers: number;
  memberCount: number;
  hasCapacity: boolean;
  memberPreviews: { id: number; name: string; matricNum: string | null }[];
};

type Course = { id: number; code: string; title: string };

type PendingRequest = {
  id: number;
  type: "JOIN" | "LEAVE";
  groupId: number;
  groupName: string;
};

type Props = {
  studentId: number;
  courses: Course[];
  selectedCode: string | null;
  groupsLocked: boolean;
  currentGroup: CurrentGroup | null;
  otherGroups: OtherGroup[];
  pendingRequests: PendingRequest[];
};

function activityLabel(iso: string | null): { dot: string; text: string } {
  if (!iso) return { dot: "bg-slate-300", text: "Tiada aktiviti" };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return { dot: "bg-emerald-500", text: "Aktif hari ini" };
  if (days === 1) return { dot: "bg-emerald-500", text: "Aktif semalam" };
  if (days < 7) return { dot: "bg-amber-500", text: `${days} hari lalu` };
  return { dot: "bg-red-500", text: `${days} hari lalu` };
}

export function GroupBrowser({
  studentId,
  courses,
  selectedCode,
  groupsLocked,
  currentGroup,
  otherGroups,
  pendingRequests,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  // Index pending requests by groupId so each card can show its own state.
  const pendingByGroup = new Map<number, PendingRequest>();
  for (const r of pendingRequests) pendingByGroup.set(r.groupId, r);
  const pendingLeave = currentGroup ? pendingByGroup.get(currentGroup.id) : undefined;

  const onOpenChat = (groupId: number) => {
    startTransition(async () => {
      const res = await ensureProjectGroupChat(groupId);
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      if (res.data.created) {
        toast.push({ kind: "success", message: "Chat kumpulan dibuka." });
      }
      window.dispatchEvent(
        new CustomEvent("ukmfolio:open-chat-group", {
          detail: { chatGroupId: res.data.chatGroupId },
        }),
      );
    });
  };

  const onJoin = (groupId: number) => {
    startTransition(async () => {
      const res = await joinGroup({ groupId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Anda telah menyertai kumpulan." });
      router.refresh();
    });
  };

  const onLeave = (groupId: number) => {
    if (!confirm("Keluar dari kumpulan ini?")) return;
    startTransition(async () => {
      const res = await leaveGroup({ groupId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Anda telah keluar dari kumpulan." });
      router.refresh();
    });
  };

  const onRequestJoin = (groupId: number) => {
    const reason = prompt(
      "Sebab anda mahu menyertai kumpulan ini (boleh dikosongkan):",
      "",
    );
    if (reason === null) return; // user cancelled prompt
    startTransition(async () => {
      const res = await requestJoinGroup({ groupId, reason: reason.trim() });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: "Permohonan dihantar. Menunggu kelulusan pensyarah.",
      });
      router.refresh();
    });
  };

  const onRequestLeave = (groupId: number) => {
    const reason = prompt(
      "Sebab anda mahu keluar dari kumpulan ini (boleh dikosongkan):",
      "",
    );
    if (reason === null) return;
    startTransition(async () => {
      const res = await requestLeaveGroup({ groupId, reason: reason.trim() });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: "Permohonan dihantar. Menunggu kelulusan pensyarah.",
      });
      router.refresh();
    });
  };

  const onCancelRequest = (requestId: number) => {
    if (!confirm("Batalkan permohonan ini?")) return;
    startTransition(async () => {
      const res = await cancelAccessRequest({ requestId });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Permohonan dibatalkan." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {courses.map((c) => {
          const active = c.code === selectedCode;
          return (
            <Link
              key={c.code}
              href={`/student/kumpulan?course=${c.code}`}
              title={c.title}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-ukm-orange text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {c.code}
            </Link>
          );
        })}
      </div>

      {selectedCode && (
        <>
          {/* Locked / open status banner */}
          {groupsLocked && (
            <div className="animate-fade-in flex items-center gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-amber-800 shadow-soft">
              <Lock size={18} className="shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Kumpulan dikunci oleh pensyarah</p>
                <p className="text-[12px] text-amber-700">
                  Anda perlu menghantar permohonan untuk sertai atau keluar kumpulan.
                  Permohonan akan disemak oleh pensyarah.
                </p>
              </div>
            </div>
          )}

          {currentGroup ? (
            <article className="animate-slide-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="gradient-group flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{currentGroup.name}</h3>
                    <p className="text-xs text-white/80">
                      {currentGroup.memberCount} / {currentGroup.maxMembers} ahli
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenChat(currentGroup.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-ukm-navy shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageCircle size={14} className="text-ukm-teal" />
                    Chat Kumpulan
                  </button>
                  {groupsLocked ? (
                    pendingLeave ? (
                      <button
                        type="button"
                        onClick={() => onCancelRequest(pendingLeave.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Klik untuk batalkan permohonan"
                      >
                        <Clock size={14} /> Permohonan Dihantar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequestLeave(currentGroup.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={14} /> Mohon Keluar
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => onLeave(currentGroup.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/85 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogOut size={14} /> Keluar
                    </button>
                  )}
                </div>
              </header>

              <div className="p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ahli Kumpulan ({currentGroup.memberCount})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentGroup.members.map((m) => {
                    const isMe = m.studentId === studentId;
                    const activity = activityLabel(m.lastActivityAt);
                    const atRisk =
                      m.totalAssignments > 0 && m.submitted < m.totalAssignments / 2;

                    return (
                      <div
                        key={m.studentId}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-2.5 py-2",
                          isMe
                            ? "border-ukm-orange/60 bg-orange-50"
                            : "border-slate-200 bg-slate-50",
                        )}
                      >
                        <Avatar
                          name={m.name}
                          avatarPath={m.avatarPath}
                          size="sm"
                          className="h-9 w-9 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="truncate text-sm font-semibold text-ukm-navy">
                              {m.name}
                            </h5>
                            {m.role === "LEADER" && (
                              <Crown size={12} className="shrink-0 text-amber-500" />
                            )}
                            {isMe && (
                              <span className="shrink-0 rounded-full bg-ukm-orange px-1.5 py-0.5 text-[9px] font-semibold text-white">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className={cn("h-1.5 w-1.5 rounded-full", activity.dot)} />
                            {m.totalAssignments > 0 && (
                              <span>
                                {m.submitted}/{m.totalAssignments} dihantar
                              </span>
                            )}
                            <span className="truncate font-mono text-[10px] text-slate-400">
                              {m.matricNum ?? "—"}
                            </span>
                          </div>
                        </div>
                        {atRisk && (
                          <span
                            title="Berisiko"
                            className="shrink-0 rounded-full bg-red-50 p-1 text-ukm-red"
                          >
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Contribution is DEMOTED to a collapsed indicator. Raw activity
                    counts are gameable, so this is an engagement hint — never a
                    grade. Completion status (the Progress tab) is the real spine. */}
                <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                    <BarChart3 size={14} className="text-ukm-teal" />
                    Lihat keseimbangan sumbangan
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {currentGroup.members.map((m) => (
                      <li key={m.studentId} className="text-xs">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-slate-700">{m.name}</span>
                          <span className="tabular-nums text-slate-500">
                            {m.contributionPct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-ukm-teal"
                            style={{ width: `${Math.min(100, m.contributionPct)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] italic text-slate-400">
                    Petunjuk penglibatan, bukan markah.
                  </p>
                </details>
              </div>
            </article>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle className="shrink-0 text-amber-600" size={22} />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">
                  Anda belum mempunyai kumpulan untuk kursus ini
                </h3>
                <p className="text-xs text-amber-700">
                  Sila pilih salah satu kumpulan di bawah untuk bergabung.
                </p>
              </div>
            </div>
          )}

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ukm-navy">
              <Grid size={16} className="text-ukm-teal" />
              {currentGroup ? "Kumpulan Lain" : "Kumpulan Tersedia"}
            </h3>
            {otherGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-6 text-center text-sm text-slate-500">
                <Users size={28} className="mx-auto mb-2 text-slate-300" />
                Tiada kumpulan lain tersedia untuk kursus ini.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {otherGroups.map((g) => {
                  const isFull = !g.hasCapacity;
                  const pct = (g.memberCount / g.maxMembers) * 100;
                  return (
                    <article
                      key={g.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-ukm-teal/40 hover:shadow-lift"
                    >
                      <div className="bg-ukm-navy px-3 py-2 text-white">
                        <div className="flex items-center justify-between">
                          <h4 className="truncate text-sm font-semibold text-white">{g.name}</h4>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isFull ? "bg-red-500/30" : "bg-white/20",
                            )}
                          >
                            {g.memberCount}/{g.maxMembers}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              isFull ? "bg-red-400" : "bg-white",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-3">
                        <ul className="mb-3 space-y-1 text-sm">
                          {g.memberPreviews.length === 0 ? (
                            <li className="text-xs italic text-slate-400">Tiada ahli lagi.</li>
                          ) : (
                            g.memberPreviews.slice(0, 3).map((p) => (
                              <li key={p.id} className="flex items-center gap-2">
                                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700">
                                  {initials(p.name)}
                                </div>
                                <span className="truncate text-xs text-slate-700">{p.name}</span>
                              </li>
                            ))
                          )}
                          {g.memberCount > Math.min(3, g.memberPreviews.length) && (
                            <li className="text-[11px] text-slate-500">
                              +{g.memberCount - Math.min(3, g.memberPreviews.length)} lagi
                            </li>
                          )}
                        </ul>
                        {!currentGroup && (() => {
                          const pendingJoin = pendingByGroup.get(g.id);
                          if (groupsLocked && pendingJoin) {
                            return (
                              <button
                                type="button"
                                onClick={() => onCancelRequest(pendingJoin.id)}
                                disabled={pending}
                                title="Klik untuk batalkan permohonan"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:opacity-50"
                              >
                                <Clock size={13} /> Permohonan Dihantar
                              </button>
                            );
                          }
                          if (groupsLocked) {
                            return (
                              <button
                                type="button"
                                onClick={() => onRequestJoin(g.id)}
                                disabled={pending || isFull}
                                className={cn(
                                  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                  isFull
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-soft hover:-translate-y-0.5",
                                )}
                              >
                                <Send size={13} />
                                {isFull ? "Kumpulan Penuh" : "Mohon Sertai"}
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => onJoin(g.id)}
                              disabled={pending || isFull}
                              className={cn(
                                "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                isFull
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "bg-ukm-orange text-white shadow-soft hover:-translate-y-0.5 hover:bg-orange-600",
                              )}
                            >
                              <UserPlus size={13} />
                              {isFull ? "Kumpulan Penuh" : "Sertai Kumpulan"}
                            </button>
                          );
                        })()}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}