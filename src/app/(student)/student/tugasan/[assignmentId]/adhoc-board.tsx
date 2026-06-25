"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UsersRound,
  UserPlus,
  Check,
  X,
  Send,
  Ban,
  Crown,
  Lock,
} from "lucide-react";
import {
  createAdHocGroup,
  invite,
  respondToInvite,
  cancelInvite,
} from "@/server/actions/ad-hoc-groups";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Avatar } from "@/components/common/Avatar";
import type { AdHocBoard, BoardGroup, BoardPendingInvite } from "@/server/queries/ad-hoc-groups";
import type { NonInvitableReason, PoolStudent } from "@/schemas/ad-hoc-group";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Groups board (Stage 4). Student-facing view of getAdHocBoard.
// Lecturers see the same group list read-only (no invite controls) — but this
// component only renders the student variant; the page gates on role.
//
// Every action returns ActionResult with a pre-localized `error` string (the
// typed InviteErrorCode is mapped to BM server-side), so the client just
// surfaces res.error and refreshes the RSC tree on success.
// ─────────────────────────────────────────────────────────────────────────────

const NON_INVITABLE_LABEL: Record<NonInvitableReason, string> = {
  IN_GROUP: "Sudah dalam kumpulan",
  ALREADY_INVITED: "Jemputan tertangguh",
};

type Props = {
  board: AdHocBoard;
  viewerId: number;
};

export function AdHocBoardView({ board, viewerId }: Props) {
  const inGroup = board.myGroupId !== null;
  const myGroup = board.groups.find((g) => g.id === board.myGroupId) ?? null;
  const isFull = myGroup ? myGroup.members.length >= myGroup.maxMembers : false;

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-2">
        <UsersRound className="text-ukm-teal" size={20} />
        <h2 className="text-lg font-semibold">Kumpulan</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          Bentuk sendiri · maks {board.cap} ahli
        </span>
      </header>

      {/* Incoming/outgoing pending invites for the viewer. */}
      {board.myPendingInvites.length > 0 && (
        <InviteInbox invites={board.myPendingInvites} />
      )}

      {/* Either "create a group" (when ungrouped) or the invite panel (when in a group). */}
      {inGroup && myGroup ? (
        <InvitePanel
          group={myGroup}
          isFull={isFull}
          invitable={board.invitable}
          nonInvitable={board.nonInvitable}
        />
      ) : (
        <CreateGroupCard assignmentId={board.assignmentId} />
      )}

      {/* The full board: every group for this assignment. */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Semua kumpulan ({board.groups.length})
        </h3>
        {board.groups.length === 0 ? (
          <EmptyState
            Icon={UsersRound}
            title="Belum ada kumpulan"
            description="Jadilah yang pertama membentuk kumpulan untuk tugasan ini."
          />
        ) : (
          board.groups.map((g) => (
            <GroupCard key={g.id} group={g} viewerId={viewerId} />
          ))
        )}
      </div>

      {board.ungrouped.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Belum berkumpulan ({board.ungrouped.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {board.ungrouped.map((s) => (
              <StudentChip key={s.id} student={s} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CreateGroupCard({ assignmentId }: { assignmentId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function onCreate() {
    startTransition(async () => {
      const res = await createAdHocGroup({
        assignmentId,
        name: name.trim() || undefined,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kumpulan berjaya dibentuk." });
      setName("");
      router.refresh();
    });
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-base font-semibold">Bentuk kumpulan anda</h3>
      <p className="text-sm text-slate-500">
        Anda belum berada dalam mana-mana kumpulan untuk tugasan ini. Bentuk satu
        dan jemput rakan, atau terima jemputan di bawah.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Nama kumpulan (pilihan)"
          className="input-base flex-1"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={isPending}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          {isPending ? <LoadingSpinner /> : <UserPlus size={16} />}
          Bentuk Kumpulan
        </button>
      </div>
    </div>
  );
}

function InvitePanel({
  group,
  isFull,
  invitable,
  nonInvitable,
}: {
  group: BoardGroup;
  isFull: boolean;
  invitable: PoolStudent[];
  nonInvitable: { student: PoolStudent; reason: NonInvitableReason }[];
}) {
  return (
    <div className="card space-y-3 border-ukm-teal/30 bg-ukm-teal/5">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold">Jemput ke &ldquo;{group.name}&rdquo;</h3>
        <span className="ml-auto text-xs text-slate-500">
          {group.members.length}/{group.maxMembers} ahli
        </span>
      </div>

      {isFull ? (
        <p className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          <Lock size={12} /> Kumpulan anda sudah penuh.
        </p>
      ) : invitable.length === 0 ? (
        <p className="text-sm text-slate-500">
          Tiada pelajar lagi yang boleh dijemput.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {invitable.map((s) => (
            <InviteRow key={s.id} groupId={group.id} student={s} />
          ))}
        </ul>
      )}

      {nonInvitable.length > 0 && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none">
            Tidak boleh dijemput ({nonInvitable.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {nonInvitable.map(({ student, reason }) => (
              <li key={student.id} className="flex items-center gap-2">
                <Avatar name={student.name} avatarPath={student.avatarPath} size="xs" />
                <span className="text-slate-600">{student.name}</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                  {NON_INVITABLE_LABEL[reason]}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function InviteRow({ groupId, student }: { groupId: number; student: PoolStudent }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function onInvite() {
    startTransition(async () => {
      const res = await invite({ groupId, inviteeId: student.id });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: `Jemputan dihantar kepada ${student.name}.` });
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 shadow-soft">
      <Avatar name={student.name} avatarPath={student.avatarPath} size="xs" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{student.name}</p>
        {student.matricNum && (
          <p className="font-mono text-[10px] text-slate-400">{student.matricNum}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onInvite}
        disabled={isPending}
        className="btn-secondary ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-xs"
      >
        {isPending ? <LoadingSpinner /> : <Send size={12} />}
        Jemput
      </button>
    </li>
  );
}

function InviteInbox({ invites }: { invites: BoardPendingInvite[] }) {
  return (
    <div className="card space-y-2 border-ukm-orange/30 bg-ukm-orange/5">
      <h3 className="text-base font-semibold">Jemputan tertangguh</h3>
      <ul className="space-y-2">
        {invites.map((inv) => (
          <InviteInboxRow key={inv.id} invite={inv} />
        ))}
      </ul>
    </div>
  );
}

function InviteInboxRow({ invite: inv }: { invite: BoardPendingInvite }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error ?? "Ralat berlaku." });
        return;
      }
      toast.push({ kind: "success", message: success });
      router.refresh();
    });
  }

  if (inv.incoming) {
    // The viewer was invited: accept or decline.
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-md bg-white px-3 py-2 shadow-soft">
        <p className="min-w-0 flex-1 text-sm">
          <strong>{inv.inviterName}</strong> menjemput anda ke{" "}
          <strong>&ldquo;{inv.groupName}&rdquo;</strong>
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              act(
                () => respondToInvite({ inviteId: inv.id, action: "ACCEPT" }),
                `Anda telah menyertai "${inv.groupName}".`,
              )
            }
            className="btn-primary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
          >
            {isPending ? <LoadingSpinner /> : <Check size={12} />}
            Terima
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              act(
                () => respondToInvite({ inviteId: inv.id, action: "DECLINE" }),
                "Jemputan ditolak.",
              )
            }
            className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
          >
            <X size={12} /> Tolak
          </button>
        </div>
      </li>
    );
  }

  // The viewer's group sent this invite: they can cancel it.
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md bg-white px-3 py-2 shadow-soft">
      <p className="min-w-0 flex-1 text-sm">
        Jemputan kepada <strong>{inv.inviteeName}</strong> untuk{" "}
        <strong>&ldquo;{inv.groupName}&rdquo;</strong>
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          act(() => cancelInvite({ inviteId: inv.id }), "Jemputan dibatalkan.")
        }
        className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
      >
        {isPending ? <LoadingSpinner /> : <Ban size={12} />}
        Batal
      </button>
    </li>
  );
}

function GroupCard({ group, viewerId }: { group: BoardGroup; viewerId: number }) {
  return (
    <article
      className={
        group.isMine
          ? "card border-ukm-teal/40 bg-ukm-teal/5"
          : "card"
      }
    >
      <header className="mb-2 flex items-center gap-2">
        <h4 className="font-semibold">{group.name}</h4>
        {group.isMine && (
          <span className="rounded-full bg-ukm-teal/15 px-2 py-0.5 text-[10px] font-medium text-ukm-teal">
            Kumpulan anda
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {group.members.length}/{group.maxMembers}
        </span>
      </header>
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
    </article>
  );
}

function StudentChip({ student }: { student: PoolStudent }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs">
      <Avatar name={student.name} avatarPath={student.avatarPath} size="xs" />
      {student.name}
    </span>
  );
}
