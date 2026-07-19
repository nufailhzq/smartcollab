"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { FastAlertButton } from "./fast-alert-button";

// ─────────────────────────────────────────────────────────────────────────────
// Progress Monitoring (Pemantauan Kemajuan) student table. Client component so
// the columns can be sorted. Adds a "Skor Sumbangan" column (free-rider signal)
// with a Berisiko badge, and a drill-down link into the student's group.
// ─────────────────────────────────────────────────────────────────────────────

export type MonitoringTableRow = {
  studentId: number;
  studentName: string;
  matricNum: string | null;
  groupName: string | null;
  lastSeenAt: string | null;
  flagged: boolean;
  flagReason: string | null;
  contributionScore: number | null;
  contributionRisk: boolean;
};

type SortKey = "name" | "group" | "lastSeen" | "contribution";
type SortDir = "asc" | "desc";

export function MonitoringTable({
  courseId,
  rows,
}: {
  courseId: number;
  rows: MonitoringTableRow[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "contribution" ? "asc" : "asc");
    }
  }

  const sorted = useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "group":
          return dir * (a.groupName ?? "").localeCompare(b.groupName ?? "");
        case "lastSeen": {
          const av = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
          const bv = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
          return dir * (av - bv);
        }
        case "contribution": {
          // Nulls sort last regardless of direction.
          const av = a.contributionScore ?? Number.POSITIVE_INFINITY;
          const bv = b.contributionScore ?? Number.POSITIVE_INFINITY;
          return dir * (av - bv);
        }
        default:
          return dir * a.studentName.localeCompare(b.studentName);
      }
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  return (
    <div className="card overflow-x-auto p-0">
      <table className="data-table">
        <thead>
          <tr>
            <SortableTh label="Pelajar" onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir} />
            <SortableTh label="Kumpulan" onClick={() => toggleSort("group")} active={sortKey === "group"} dir={sortDir} />
            <SortableTh
              label="Skor Sumbangan"
              onClick={() => toggleSort("contribution")}
              active={sortKey === "contribution"}
              dir={sortDir}
            />
            <SortableTh
              label="Online Terakhir"
              onClick={() => toggleSort("lastSeen")}
              active={sortKey === "lastSeen"}
              dir={sortDir}
            />
            <th className="text-center">Tindakan</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const atRisk = r.flagged || r.contributionRisk;
            const lastSeen = r.lastSeenAt ? new Date(r.lastSeenAt) : null;
            return (
              <tr
                key={r.studentId}
                className={
                  atRisk
                    ? "border-l-4 border-ukm-red bg-red-50/30"
                    : "border-l-4 border-transparent"
                }
              >
                <td>
                  <p className="font-semibold text-ukm-navy">{r.studentName}</p>
                  <p className="font-mono text-[11px] text-slate-500">{r.matricNum ?? "—"}</p>
                </td>
                <td>
                  {r.groupName ? (
                    <Link
                      href={`/lecturer/pemantauan/kumpulan/${courseId}?group=${encodeURIComponent(r.groupName)}`}
                      className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 hover:bg-sky-100 hover:underline"
                    >
                      {r.groupName}
                    </Link>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">—</span>
                  )}
                </td>
                <td>
                  {r.contributionScore === null ? (
                    <span className="text-[11px] italic text-slate-400">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          r.contributionRisk ? "text-ukm-red" : "text-ukm-navy"
                        }`}
                      >
                        {r.contributionScore}
                      </span>
                      {r.contributionRisk && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-ukm-red">
                          <AlertTriangle size={10} /> Berisiko
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="text-xs">
                  {lastSeen ? (
                    <span
                      className={
                        Date.now() - lastSeen.getTime() < 10 * 60 * 1000
                          ? "inline-flex items-center gap-1 font-semibold text-emerald-600"
                          : Date.now() - lastSeen.getTime() < 24 * 60 * 60 * 1000
                            ? "text-slate-600"
                            : "text-slate-400"
                      }
                      title={lastSeen.toLocaleString("ms-MY")}
                    >
                      {Date.now() - lastSeen.getTime() < 10 * 60 * 1000 && (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {relativeTime(lastSeen)}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">belum dilihat</span>
                  )}
                </td>
                <td className="text-center">
                  <FastAlertButton
                    courseId={courseId}
                    studentId={r.studentId}
                    studentName={r.studentName}
                    flagReason={r.flagReason}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortableTh({
  label,
  onClick,
  active,
  dir,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <th>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition hover:text-ukm-navy ${
          active ? "text-ukm-navy" : ""
        }`}
      >
        {label}
        <ArrowUpDown size={12} className={active ? "text-ukm-teal" : "text-slate-300"} />
        {active && <span className="text-[9px] text-ukm-teal">{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}
