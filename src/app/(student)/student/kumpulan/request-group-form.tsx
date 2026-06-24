"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Users } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { requestGroup } from "@/server/actions/groups";

type Classmate = { id: number; name: string; matricNum: string | null };

export function RequestGroupForm({
  courseId,
  classmates,
}: {
  courseId: number;
  classmates: Classmate[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  const toggle = (id: number) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const submit = () => {
    startTransition(async () => {
      const res = await requestGroup({ courseId, name, memberIds });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: "Permohonan dihantar. Menunggu kelulusan pensyarah.",
      });
      setName("");
      setMemberIds([]);
      router.refresh();
    });
  };

  return (
    <section className="card space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-ukm-navy">
        <Users size={20} className="text-ukm-teal" /> Mohon Kumpulan
      </h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama kumpulan"
        className="input-base"
      />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pilih ahli ({memberIds.length} dipilih)
        </p>
        {classmates.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            Tiada rakan sekursus yang masih boleh dipilih.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {classmates.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={memberIds.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 rounded border-slate-300 text-ukm-teal focus:ring-ukm-teal"
                />
                <span className="truncate text-ukm-navy">{c.name}</span>
                <span className="ml-auto font-mono text-[10px] text-slate-400">
                  {c.matricNum}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={pending || name.trim().length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-ukm-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={16} /> Hantar Permohonan
      </button>
    </section>
  );
}
