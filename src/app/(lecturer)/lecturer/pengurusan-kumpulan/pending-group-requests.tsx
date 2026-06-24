"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, X } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { setGroupStatus } from "@/server/actions/lecturer-groups";

type PendingGroup = {
  id: number;
  name: string;
  members: { id: number; name: string; matricNum: string | null; role: "LEADER" | "MEMBER" }[];
};

export function PendingGroupRequests({ groups }: { groups: PendingGroup[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const act = (groupId: number, action: "APPROVE" | "REJECT") => {
    startTransition(async () => {
      const res = await setGroupStatus({ groupId, action });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message: action === "APPROVE" ? "Kumpulan diluluskan." : "Permohonan ditolak.",
      });
      router.refresh();
    });
  };

  if (groups.length === 0) return null;

  return (
    <section className="card space-y-3">
      <h3 className="text-lg font-semibold text-ukm-navy">
        Permohonan Kumpulan Tertunggak ({groups.length})
      </h3>
      <ul className="space-y-3">
        {groups.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ukm-navy">{g.name}</p>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                {g.members.map((m) => (
                  <li key={m.id} className="inline-flex items-center gap-1">
                    {m.role === "LEADER" && <Crown size={11} className="text-amber-500" />}
                    {m.name}
                    <span className="font-mono text-[10px] text-slate-400">{m.matricNum}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => act(g.id, "APPROVE")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                <Check size={15} /> Lulus
              </button>
              <button
                type="button"
                onClick={() => act(g.id, "REJECT")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                <X size={15} /> Tolak
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
