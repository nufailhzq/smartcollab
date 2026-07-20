"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Send, Sparkles, Users } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { requestGroup } from "@/server/actions/groups";
import { formatDateTime } from "@/lib/utils";

type Classmate = { id: number; name: string; matricNum: string | null };

export function RequestGroupForm({
  courseId,
  classmates,
  selfService,
  maxMembers,
  closeAt,
}: {
  courseId: number;
  classmates: Classmate[];
  /** True when the course lets students form groups without lecturer approval. */
  selfService: boolean;
  /** Member cap (including the leader). */
  maxMembers: number;
  /** ISO cutoff for forming groups, or null. */
  closeAt: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  // memberIds excludes the leader (current student), who always counts as 1.
  const totalSelected = memberIds.length + 1;
  const atCapacity = totalSelected >= maxMembers;

  const toggle = (id: number) =>
    setMemberIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Enforce the cap (leader + members) so the student can't over-select.
      if (prev.length + 1 >= maxMembers) {
        toast.push({ kind: "error", message: `Had kumpulan ialah ${maxMembers} ahli.` });
        return prev;
      }
      return [...prev, id];
    });

  const submit = () => {
    startTransition(async () => {
      const res = await requestGroup({ courseId, name, memberIds });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: selfService
          ? "Kumpulan berjaya dibentuk."
          : "Permohonan dihantar. Menunggu kelulusan pensyarah.",
      });
      setName("");
      setMemberIds([]);
      router.refresh();
    });
  };

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-ukm-navy">
          <Users size={20} className="text-ukm-teal" />
          {selfService ? "Buat Kumpulan" : "Mohon Kumpulan"}
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            selfService
              ? "bg-ukm-teal/10 text-ukm-teal"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {selfService ? (
            <>
              <Sparkles size={11} /> Tanpa kelulusan
            </>
          ) : (
            "Perlu kelulusan pensyarah"
          )}
        </span>
      </div>
      {closeAt && (
        <p className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
          <CalendarClock size={12} /> Tutup pembentukan: {formatDateTime(closeAt)}
        </p>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama kumpulan"
        className="input-base"
      />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pilih ahli ({totalSelected}/{maxMembers} termasuk anda)
        </p>
        {classmates.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            Tiada rakan sekursus yang masih boleh dipilih.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {classmates.map((c) => {
              const checked = memberIds.includes(c.id);
              const disabled = !checked && atCapacity;
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm ${
                    disabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded border-slate-300 text-ukm-teal focus:ring-ukm-teal"
                  />
                  <span className="truncate text-ukm-navy">{c.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-slate-400">
                    {c.matricNum}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={pending || name.trim().length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-ukm-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={16} /> {selfService ? "Buat Kumpulan" : "Hantar Permohonan"}
      </button>
    </section>
  );
}
