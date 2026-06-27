"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UsersRound,
  UserPlus,
  Send,
  Crown,
  Lock,
  Clock,
  Hourglass,
  LogIn,
  Check,
} from "lucide-react";
import {
  createAdHocGroup,
  joinOpenGroup,
  inviteToOpenGroup,
} from "@/server/actions/ad-hoc-groups";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Avatar } from "@/components/common/Avatar";
import { formatDateTime } from "@/lib/utils";
import type { AdHocBoard, BoardGroup } from "@/server/queries/ad-hoc-groups";
import type { NonInvitableReason, PoolStudent } from "@/schemas/ad-hoc-group";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Groups board, two modes:
//   CUSTOM — students form their own group (name + chosen friends), PENDING
//            until the lecturer approves. Members are locked while pending.
//   OPEN   — lecturer opened empty groups; students self-join and members pull
//            friends in (auto-join). Joining locks at joinCloseAt.
//
// Actions return ActionResult with a pre-localized `error`; the client surfaces
// res.error and refreshes the RSC tree on success.
// ─────────────────────────────────────────────────────────────────────────────

const NON_SELECTABLE_LABEL: Record<NonInvitableReason, string> = {
  IN_GROUP: "Sudah dalam kumpulan",
  IN_PENDING: "Dalam permohonan tertangguh",
};

type Props = {
  board: AdHocBoard;
  viewerId: number;
};

export function AdHocBoardView({ board, viewerId }: Props) {
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center gap-2">
        <UsersRound className="text-ukm-teal" size={20} />
        <h2 className="text-lg font-semibold">Kumpulan</h2>
        {board.groupingMode === "CUSTOM" ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            Bentuk sendiri · perlu kelulusan
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            Kumpulan terbuka · sertai sendiri
          </span>
        )}
        {board.groupingMode === "OPEN" && board.joinCloseAt && (
          <span
            className={
              board.joinClosed
                ? "inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
                : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
            }
          >
            {board.joinClosed ? <Lock size={11} /> : <Clock size={11} />}
            {board.joinClosed ? "Penyertaan ditutup" : `Tutup: ${formatDateTime(board.joinCloseAt)}`}
          </span>
        )}
      </header>

      {board.groupingMode === "CUSTOM" ? (
        <CustomMode board={board} viewerId={viewerId} />
      ) : (
        <OpenMode board={board} viewerId={viewerId} />
      )}
    </section>
  );
}

// ─── CUSTOM (Mode A) ─────────────────────────────────────────────────────────

function CustomMode({ board, viewerId }: { board: AdHocBoard; viewerId: number }) {
  const myGroup = board.groups.find((g) => g.id === board.myGroupId) ?? null;

  return (
    <>
      {board.myGroupPending ? (
        <div className="card flex items-center gap-3 border-amber-300/50 bg-amber-50">
          <Hourglass className="shrink-0 text-amber-500" size={20} />
          <div>
            <p className="font-semibold text-amber-800">Menunggu kelulusan pensyarah</p>
            <p className="text-xs text-amber-700">
              Permohonan kumpulan &ldquo;{myGroup?.name}&rdquo; telah dihantar. Anda tidak boleh
              menyertai kumpulan lain sehingga ia diluluskan atau ditolak.
            </p>
          </div>
        </div>
      ) : myGroup ? (
        <div className="card border-emerald-400/40 bg-emerald-50/50">
          <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <Check size={16} /> Anda dalam kumpulan yang diluluskan
          </p>
        </div>
      ) : (
        <CreateGroupCard
          assignmentId={board.assignmentId}
          selectable={board.selectable}
          nonSelectable={board.nonSelectable}
          cap={board.cap}
        />
      )}

      <AllGroups board={board} viewerId={viewerId} showStatus />
    </>
  );
}

function CreateGroupCard({
  assignmentId,
  selectable,
  nonSelectable,
  cap,
}: {
  assignmentId: number;
  selectable: PoolStudent[];
  nonSelectable: { student: PoolStudent; reason: NonInvitableReason }[];
  cap: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onCreate() {
    startTransition(async () => {
      const res = await createAdHocGroup({
        assignmentId,
        name: name.trim() || undefined,
        memberIds: Array.from(picked),
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Permohonan dihantar. Menunggu kelulusan pensyarah." });
      setName("");
      setPicked(new Set());
      router.refresh();
    });
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-base font-semibold">Bentuk kumpulan anda</h3>
      <p className="text-sm text-slate-500">
        Pilih rakan sekumpulan (sehingga {cap - 1} orang) dan hantar untuk kelulusan pensyarah.
        Anda menjadi ketua kumpulan.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
        placeholder="Nama kumpulan (pilihan)"
        className="input-base"
        disabled={isPending}
      />

      {selectable.length === 0 ? (
        <p className="text-sm text-slate-500">Tiada pelajar lagi yang boleh dipilih.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {selectable.map((s) => {
            const on = picked.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  disabled={isPending}
                  className={
                    on
                      ? "flex w-full items-center gap-2 rounded-md border-2 border-ukm-teal bg-ukm-teal/5 px-2 py-1.5 text-left"
                      : "flex w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left hover:border-ukm-teal/50"
                  }
                >
                  <Avatar name={s.name} avatarPath={s.avatarPath} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                  {on && <Check size={14} className="text-ukm-teal" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {nonSelectable.length > 0 && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none">
            Tidak boleh dipilih ({nonSelectable.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {nonSelectable.map(({ student, reason }) => (
              <li key={student.id} className="flex items-center gap-2">
                <Avatar name={student.name} avatarPath={student.avatarPath} size="xs" />
                <span className="text-slate-600">{student.name}</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                  {NON_SELECTABLE_LABEL[reason]}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <button
        type="button"
        onClick={onCreate}
        disabled={isPending}
        className="btn-primary inline-flex items-center justify-center gap-2"
      >
        {isPending ? <LoadingSpinner /> : <UserPlus size={16} />}
        Hantar Permohonan ({picked.size + 1} ahli)
      </button>
    </div>
  );
}

// ─── OPEN (Mode B) ───────────────────────────────────────────────────────────

function OpenMode({ board, viewerId }: { board: AdHocBoard; viewerId: number }) {
  const inGroup = board.myGroupId !== null;

  return (
    <>
      {board.joinClosed && !inGroup && (
        <div className="card flex items-center gap-3 border-red-300/50 bg-red-50">
          <Lock className="shrink-0 text-red-500" size={20} />
          <p className="text-sm text-red-700">
            Tempoh menyertai kumpulan telah ditutup. Sila hubungi pensyarah.
          </p>
        </div>
      )}

      <AllGroups
        board={board}
        viewerId={viewerId}
        joinable={!inGroup && !board.joinClosed}
        invitable={inGroup && !board.joinClosed ? board.selectable : []}
      />
    </>
  );
}

// ─── Shared group list ───────────────────────────────────────────────────────

function AllGroups({
  board,
  viewerId,
  showStatus = false,
  joinable = false,
  invitable = [],
}: {
  board: AdHocBoard;
  viewerId: number;
  showStatus?: boolean;
  joinable?: boolean;
  invitable?: PoolStudent[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Semua kumpulan ({board.groups.length})
      </h3>
      {board.groups.length === 0 ? (
        <EmptyState
          Icon={UsersRound}
          title="Belum ada kumpulan"
          description={
            board.groupingMode === "CUSTOM"
              ? "Jadilah yang pertama membentuk kumpulan untuk tugasan ini."
              : "Pensyarah belum membuka mana-mana kumpulan."
          }
        />
      ) : (
        board.groups.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            viewerId={viewerId}
            showStatus={showStatus}
            joinable={joinable}
            invitable={invitable}
          />
        ))
      )}

      {board.ungrouped.length > 0 && (
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Belum berkumpulan ({board.ungrouped.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {board.ungrouped.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <Avatar name={s.name} avatarPath={s.avatarPath} size="xs" />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_BADGE: Record<BoardGroup["status"], { label: string; cls: string }> = {
  PENDING: { label: "Menunggu kelulusan", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Diluluskan", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
};

function GroupCard({
  group,
  viewerId,
  showStatus,
  joinable,
  invitable,
}: {
  group: BoardGroup;
  viewerId: number;
  showStatus: boolean;
  joinable: boolean;
  invitable: PoolStudent[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function onJoin() {
    startTransition(async () => {
      const res = await joinOpenGroup({ groupId: group.id });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: `Anda menyertai "${group.name}".` });
      router.refresh();
    });
  }

  const badge = STATUS_BADGE[group.status];

  return (
    <article className={group.isMine ? "card border-ukm-teal/40 bg-ukm-teal/5" : "card"}>
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <h4 className="font-semibold">{group.name}</h4>
        {group.isMine && (
          <span className="rounded-full bg-ukm-teal/15 px-2 py-0.5 text-[10px] font-medium text-ukm-teal">
            Kumpulan anda
          </span>
        )}
        {showStatus && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {group.members.length}/{group.maxMembers}
        </span>
      </header>

      {group.members.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-xs shadow-soft"
            >
              <Avatar name={m.name} avatarPath={m.avatarPath} size="xs" />
              <span className={m.id === viewerId ? "font-semibold" : ""}>
                {m.id === viewerId ? "Anda" : m.name}
              </span>
              {m.role === "LEADER" && <Crown size={11} className="text-ukm-orange" />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-slate-400">Kumpulan kosong</p>
      )}

      {/* OPEN-mode self-join button (for groups the viewer isn't in). */}
      {joinable && !group.isMine && (
        <button
          type="button"
          onClick={onJoin}
          disabled={isPending || !group.hasCapacity}
          className="btn-secondary mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          {isPending ? <LoadingSpinner /> : <LogIn size={13} />}
          {group.hasCapacity ? "Sertai" : "Penuh"}
        </button>
      )}

      {/* OPEN-mode invite-friend control (for the viewer's own group). */}
      {group.isMine && invitable.length > 0 && group.hasCapacity && (
        <InviteFriends groupId={group.id} invitable={invitable} />
      )}
    </article>
  );
}

function InviteFriends({ groupId, invitable }: { groupId: number; invitable: PoolStudent[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function onInvite(student: PoolStudent) {
    startTransition(async () => {
      const res = await inviteToOpenGroup({ groupId, inviteeId: student.id });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: `${student.name} ditambah ke kumpulan.` });
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ukm-teal"
      >
        <UserPlus size={13} /> Jemput rakan ({invitable.length})
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {invitable.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 shadow-soft"
            >
              <Avatar name={s.name} avatarPath={s.avatarPath} size="xs" />
              <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
              <button
                type="button"
                onClick={() => onInvite(s)}
                disabled={isPending}
                className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
              >
                {isPending ? <LoadingSpinner /> : <Send size={12} />}
                Jemput
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
