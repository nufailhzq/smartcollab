"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { markNotificationRead } from "@/server/actions/notifications";

type Warning = {
  id: number;
  title: string;
  message: string;
  createdAt: string;
};

export function WarningBanner({ warnings }: { warnings: Warning[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (warnings.length === 0) return null;

  const dismiss = (id: number) => {
    startTransition(async () => {
      await markNotificationRead({ id });
      router.refresh();
    });
  };

  return (
    <section className="space-y-3 animate-slide-up">
      {warnings.map((w) => (
        <div
          key={w.id}
          role="alert"
          className="flex items-start gap-3 rounded-xl border-l-4 border-l-ukm-red bg-gradient-to-r from-red-50 via-red-50 to-white p-4 shadow-soft"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ukm-red text-white shadow-soft">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ukm-red">{w.title}</p>
            <p className="mt-1 text-sm text-slate-700">{w.message}</p>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {new Date(w.createdAt).toLocaleString("ms-MY", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(w.id)}
            disabled={pending}
            aria-label="Tutup amaran"
            className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}
