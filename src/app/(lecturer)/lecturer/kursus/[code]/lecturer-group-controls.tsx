"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Crown, Shuffle } from "lucide-react";
import {
  setAssignmentGroupsLock,
  reassignStudentToGroup,
} from "@/server/actions/ad-hoc-groups";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { AdHocBoard } from "@/server/queries/ad-hoc-groups";

// ─────────────────────────────────────────────────────────────────────────────
// Lecturer per-assignment group management (Stage 4, Action 5).
//   - Kunci Kumpulan toggle: OPEN (Manual) assignments only — freezes student
//     join/leave. The lecturer override below still works while locked.
//   - Manual Override: reassign ANY student to any group (or remove them) via a
//     dropdown, for BOTH Auto (RANDOM) and Manual (OPEN). Works regardless of lock.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  board: AdHocBoard;
};

export function LecturerGroupControls({ board }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const isManual = board.groupingMode === "OPEN";

  function toggleLock() {
    startTransition(async () => {
      const res = await setAssignmentGroupsLock({
        assignmentId: board.assignmentId,
        locked: !board.groupsLocked,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({
        kind: "success",
        message: board.groupsLocked ? "Kumpulan dibuka semula." : "Kumpulan dikunci.",
      });
      router.refresh();
    });
  }

  function reassign(studentId: number, targetGroupId: number | null) {
    startTransition(async () => {
      const res = await reassignStudentToGroup({
        assignmentId: board.assignmentId,
        studentId,
        targetGroupId,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kumpulan pelajar dikemaskini." });
      router.refresh();
    });
  }

  // Every enrolled student with their current group (members across all groups
  // + the ungrouped pool), for the override dropdowns.
  const rows = [
    ...board.groups.flatMap((g) =>
      g.members.map((m) => ({
        studentId: m.id,
        name: m.name,
        matricNum: m.matricNum,
        currentGroupId: g.id as number | null,
      })),
    ),
    ...board.ungrouped.map((s) => ({
      studentId: s.id,
      name: s.name,
      matricNum: s.matricNum,
      currentGroupId: null as number | null,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {board.groupingMode === "RANDOM" ? "Kumpulan Auto" : "Kumpulan Manual"}
        </span>
        {isManual && (
          <button
            type="button"
            onClick={toggleLock}
            disabled={isPending}
            className={
              board.groupsLocked
                ? "inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                : "inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            }
          >
            {isPending ? (
              <LoadingSpinner />
            ) : board.groupsLocked ? (
              <Lock size={13} />
            ) : (
              <Unlock size={13} />
            )}
            {board.groupsLocked ? "Kumpulan Dikunci — Buka" : "Kunci Kumpulan"}
          </button>
        )}
      </div>

      {/* Manual override — reassign any student to any group. */}
      <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <summary className="cursor-pointer select-none text-xs font-semibold text-ukm-navy">
          <Shuffle size={12} className="mr-1 inline" />
          Pindah pelajar (override pensyarah)
        </summary>
        <ul className="mt-2 space-y-1.5">
          {rows.map((r) => (
            <li
              key={r.studentId}
              className="flex flex-wrap items-center gap-2 rounded-md bg-white px-2 py-1.5 shadow-soft"
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {r.name}
                {r.matricNum && (
                  <span className="ml-1 font-mono text-[10px] text-slate-400">{r.matricNum}</span>
                )}
              </span>
              <select
                value={r.currentGroupId ?? ""}
                disabled={isPending}
                onChange={(e) =>
                  reassign(r.studentId, e.target.value === "" ? null : Number(e.target.value))
                }
                className="input-base max-w-[200px] py-1 text-xs"
              >
                <option value="">— Tiada kumpulan —</option>
                {board.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.members.length}/{g.maxMembers})
                  </option>
                ))}
              </select>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-1 text-xs italic text-slate-400">Tiada pelajar berdaftar.</li>
          )}
        </ul>
      </details>
    </div>
  );
}

/** Tiny read-only group summary shown in the lecturer assignment card. */
export function LecturerGroupSummary({ board }: { board: AdHocBoard }) {
  return (
    <ul className="mt-2 space-y-1 text-xs text-slate-600">
      {board.groups.map((g) => (
        <li key={g.id} className="flex items-center gap-1.5">
          <span className="font-medium text-ukm-navy">{g.name}</span>
          <span className="text-slate-400">
            {g.members.length}/{g.maxMembers}
          </span>
          {g.members.some((m) => m.role === "LEADER") && (
            <Crown size={10} className="text-ukm-orange" />
          )}
        </li>
      ))}
    </ul>
  );
}
