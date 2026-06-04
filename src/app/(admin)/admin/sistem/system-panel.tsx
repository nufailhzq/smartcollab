"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Database,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { reseedDatabase } from "@/server/actions/admin-system";
import type { SystemStats } from "@/server/queries/admin";

type Props = {
  stats: SystemStats;
  isProduction: boolean;
};

export function SystemPanel({ stats, isProduction }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [lastRun, setLastRun] = useState<{
    durationMs: number;
    exitCode: number;
    output: string;
  } | null>(null);

  const onReseed = () => {
    const confirmed = confirm(
      "Jalankan semula seed pangkalan data?\n\nPengguna, kursus, kandungan, dan kumpulan akan diupsert. Kandungan terbina (tugasan/mesej/acara) tidak akan diduplikasi jika sudah wujud.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await reseedDatabase();
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setLastRun(res.data);
      toast.push({
        kind: "success",
        message: `Seed selesai dalam ${(res.data.durationMs / 1000).toFixed(1)}s.`,
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pengguna" value={stats.users} Icon={Users} accent="text-ukm-teal" />
        <StatCard
          label="Pelajar"
          value={stats.students}
          Icon={GraduationCap}
          accent="text-sky-500"
        />
        <StatCard
          label="Pensyarah"
          value={stats.lecturers}
          Icon={ShieldCheck}
          accent="text-violet-500"
        />
        <StatCard label="Kursus" value={stats.courses} Icon={BookOpen} accent="text-ukm-orange" />
        <StatCard
          label="Pendaftaran"
          value={stats.enrollments}
          Icon={ClipboardList}
          accent="text-emerald-500"
        />
        <StatCard
          label="Tugasan"
          value={stats.assignments}
          Icon={ClipboardList}
          accent="text-amber-500"
        />
        <StatCard
          label="Penghantaran"
          value={stats.submissions}
          Icon={ClipboardList}
          accent="text-rose-500"
        />
        <StatCard label="Acara" value={stats.events} Icon={Activity} accent="text-indigo-500" />
      </section>

      <section className="card-elevated">
        <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-ukm-navy">
          <Database size={18} className="text-ukm-teal" /> Operasi Pangkalan Data
        </header>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <h3 className="text-base font-semibold text-ukm-navy">Jalankan semula seed</h3>
            <p className="mt-1 text-sm text-slate-600">
              Memulihkan akaun lalai, kursus katalog, dan data demo. Operasi adalah idempotent —
              pengguna sedia ada akan dikemaskini, bukan diduplikasi.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              <li>• Akaun pelajar/pensyarah/pentadbir diupsert (kata laluan asal dipulihkan).</li>
              <li>• Kursus, pendaftaran, dan kumpulan diupsert.</li>
              <li>
                • Tugasan, mesej, kandungan kursus, dan kalendar hanya dijana jika belum wujud.
              </li>
            </ul>
            {isProduction && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Mod pengeluaran dikesan. Reseed dilumpuhkan kecuali pemboleh ubah persekitaran{" "}
                  <code className="font-mono">ALLOW_ADMIN_RESEED=1</code> ditetapkan.
                </span>
              </div>
            )}
          </div>
          <div className="flex items-start lg:items-center">
            <button
              type="button"
              onClick={onReseed}
              disabled={pending}
              className="btn-primary gap-2 whitespace-nowrap"
            >
              <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
              {pending ? "Sedang dijalankan…" : "Jalankan Seed"}
            </button>
          </div>
        </div>
      </section>

      {lastRun && (
        <section className="card">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ukm-navy">Output run terakhir</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                lastRun.exitCode === 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              exit {lastRun.exitCode} · {(lastRun.durationMs / 1000).toFixed(2)}s
            </span>
          </header>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
            {lastRun.output.trim() || "(tiada output)"}
          </pre>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50">
        <Icon className={accent} size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-ukm-navy">{value.toLocaleString()}</p>
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      </div>
    </div>
  );
}
