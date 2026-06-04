"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Loader2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/server/actions/friends";

export type FriendshipStatus =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "pending-sent"; friendshipId: number }
  | { kind: "pending-received"; friendshipId: number }
  | { kind: "accepted"; friendshipId: number };

type Props = {
  otherUserId: number;
  otherUserName: string;
  status: FriendshipStatus;
};

/**
 * Friend-state CTA shown on a user's Folio profile. Rendered based on the
 * relationship between the viewer and the profile owner:
 *   self           → hidden
 *   none           → "Tambah Rakan"           → sendFriendRequest
 *   pending-sent   → "Permintaan dihantar"    → removeFriend (cancels)
 *   pending-received → "Terima" + "Tolak"     → accept / reject
 *   accepted       → "Rakan"  (hover: Buang)  → removeFriend
 */
export function FriendButton({ otherUserId, otherUserName, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: true } | { ok: true; data: unknown } | { ok: false; error: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (status.kind === "self") return null;

  if (status.kind === "none") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => run(() => sendFriendRequest({ to: otherUserId }))}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          Tambah Rakan
        </button>
        {error && <p className="text-[11px] text-ukm-red">{error}</p>}
      </div>
    );
  }

  if (status.kind === "pending-sent") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => {
            if (!confirm(`Batalkan permintaan rakan kepada ${otherUserName}?`)) return;
            run(() => removeFriend({ friendId: otherUserId }));
          }}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 shadow-soft transition hover:bg-amber-100 disabled:opacity-50"
          title="Klik untuk batalkan permintaan"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
          Permintaan dihantar
        </button>
        {error && <p className="text-[11px] text-ukm-red">{error}</p>}
      </div>
    );
  }

  if (status.kind === "pending-received") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              run(() => acceptFriendRequest({ friendshipId: status.friendshipId }))
            }
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Terima
          </button>
          <button
            type="button"
            onClick={() =>
              run(() => rejectFriendRequest({ friendshipId: status.friendshipId }))
            }
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-soft transition hover:bg-slate-50 hover:text-ukm-red disabled:opacity-50"
          >
            <X size={14} />
            Tolak
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          {otherUserName} ingin menjadi rakan anda
        </p>
        {error && <p className="text-[11px] text-ukm-red">{error}</p>}
      </div>
    );
  }

  // accepted — show "Rakan" pill with a hover/click-to-remove path.
  return (
    <FriendAcceptedBadge
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      pending={pending}
      onRemove={() => {
        if (!confirm(`Buang ${otherUserName} daripada senarai rakan?`)) return;
        run(() => removeFriend({ friendId: otherUserId }));
      }}
      error={error}
    />
  );
}

function FriendAcceptedBadge({
  otherUserName,
  pending,
  onRemove,
  error,
}: {
  otherUserId: number;
  otherUserName: string;
  pending: boolean;
  onRemove: () => void;
  error: string | null;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={`Buang ${otherUserName} daripada rakan`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold shadow-soft transition disabled:opacity-50 ${
          hover
            ? "bg-red-50 text-ukm-red"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : hover ? (
          <UserX size={14} />
        ) : (
          <UserCheck size={14} />
        )}
        {hover ? "Buang Rakan" : "Rakan"}
      </button>
      {error && <p className="text-[11px] text-ukm-red">{error}</p>}
    </div>
  );
}
