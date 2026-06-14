"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
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
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          {courses.map((c) => {
            const active = c.code === selectedCode;
            return (
              <Link
                key={c.code}
                href={`/student/kumpulan?course=${c.code}`}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-ukm-orange text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {c.code} — {c.title}
              </Link>
            );
          })}
        </div>
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
            <article className="animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-spring hover:shadow-lift">
              <header className="gradient-group flex items-center justify-between px-6 py-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentGroup.name}</h3>
                    <p className="text-sm text-white/80">
                      {currentGroup.memberCount} / {currentGroup.maxMembers} ahli
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChat(currentGroup.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-ukm-navy shadow-soft transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageCircle size={16} className="text-ukm-teal" />
                    Buka Chat Kumpulan
                  </button>
                  {groupsLocked ? (
                    pendingLeave ? (
                      <button
                        type="button"
                        onClick={() => onCancelRequest(pendingLeave.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
                        title="Klik untuk batalkan permohonan"
                      >
                        <Clock size={16} /> Permohonan Keluar Dihantar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequestLeave(currentGroup.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={16} /> Mohon Keluar
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => onLeave(currentGroup.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500/85 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogOut size={16} /> Keluar Kumpulan
                    </button>
                  )}
                </div>
              </header>

              <div className="p-6">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ahli Kumpulan ({currentGroup.memberCount})
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {currentGroup.members.map((m, idx) => {
                    const isMe = m.studentId === studentId;
                    const activity = activityLabel(m.lastActivityAt);

                    return (
                      <div
                        key={m.studentId}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        className={cn(
                          "animate-slide-up rounded-xl border-2 p-4 transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:shadow-soft",
                          isMe
                            ? "border-ukm-orange bg-orange-50"
                            : "border-slate-200 bg-slate-50 hover:border-ukm-teal/40",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar
                            name={m.name}
                            avatarPath={m.avatarPath}
                            size="lg"
                            ring
                            className={cn(
                              "h-14 w-14 border-2",
                              isMe ? "border-ukm-orange" : "border-slate-200",
                            )}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-semibold text-ukm-navy">{m.name}</h5>
                              {m.role === "LEADER" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                  <Crown size={10} /> Ketua
                                </span>
                              )}
                              {isMe && (
                                <span className="rounded-full bg-ukm-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-xs text-slate-500">
                              {m.matricNum ?? "—"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <div className="inline-flex items-center gap-1">
                                <BarChart3 size={12} className="text-ukm-teal" />
                                <span>Sumbangan: {m.contributionPct}%</span>
                              </div>
                              <div className="inline-flex items-center gap-1.5">
                                <span className={cn("h-2 w-2 rounded-full", activity.dot)} />
                                <span>{activity.text}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-200">
                <AlertCircle className="text-amber-700" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">
                  Anda belum mempunyai kumpulan untuk kursus ini
                </h3>
                <p className="text-sm text-amber-700">
                  Sila pilih salah satu kumpulan di bawah untuk bergabung.
                </p>
              </div>
            </div>
          )}

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ukm-navy">
              <Grid size={20} className="text-ukm-teal" />
              {currentGroup ? "Kumpulan Lain" : "Kumpulan Tersedia"}
            </h3>
            {otherGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
                <Users size={36} className="mx-auto mb-2 text-slate-300" />
                Tiada kumpulan lain tersedia untuk kursus ini.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {otherGroups.map((g, idx) => {
                  const isFull = !g.hasCapacity;
                  const pct = (g.memberCount / g.maxMembers) * 100;
                  return (
                    <article
                      key={g.id}
                      style={{ animationDelay: `${idx * 70}ms` }}
                      className="animate-slide-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-ukm-teal/40 hover:shadow-lift"
                    >
                      <div className="bg-ukm-navy px-4 py-3 text-white">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white">{g.name}</h4>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              isFull ? "bg-red-500/30" : "bg-white/20",
                            )}
                          >
                            {g.memberCount}/{g.maxMembers}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              isFull ? "bg-red-400" : "bg-white",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4">
                        <ul className="mb-4 min-h-[60px] space-y-1.5 text-sm">
                          {g.memberPreviews.length === 0 ? (
                            <li className="italic text-slate-400">Tiada ahli lagi.</li>
                          ) : (
                            g.memberPreviews.map((p) => (
                              <li key={p.id} className="flex items-center gap-2">
                                <div className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                                  {initials(p.name)}
                                </div>
                                <span className="text-slate-700">{p.name}</span>
                                <span className="ml-auto font-mono text-[10px] text-slate-400">
                                  {p.matricNum}
                                </span>
                              </li>
                            ))
                          )}
                          {g.memberCount > g.memberPreviews.length && (
                            <li className="text-xs text-slate-500">
                              +{g.memberCount - g.memberPreviews.length} lagi
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
                                className="w-full rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-lift disabled:opacity-50"
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  <Clock size={14} /> Permohonan Dihantar
                                </span>
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
                                  "w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-spring",
                                  isFull
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
                                )}
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  <Send size={14} />
                                  {isFull ? "Kumpulan Penuh" : "Mohon Sertai"}
                                </span>
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => onJoin(g.id)}
                              disabled={pending || isFull}
                              className={cn(
                                "w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-spring",
                                isFull
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "bg-ukm-orange text-white shadow-soft hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lift",
                              )}
                            >
                              <span className="inline-flex items-center justify-center gap-2">
                                <UserPlus size={14} />
                                {isFull ? "Kumpulan Penuh" : "Sertai Kumpulan"}
                              </span>
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