"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { toggleAllNotifications } from "@/server/actions/preferences";
import { useToast } from "@/components/common/Toast";

/**
 * Big-rocker toggle for the master notification mute, surfaced on the profile
 * page. Flips notificationsMuted on the User row server-side and refreshes
 * the route so the navbar bell + MessageStream pick up the new flag.
 */
export function MuteToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [muted, setMuted] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !muted;
    setMuted(next); // optimistic
    startTransition(async () => {
      const res = await toggleAllNotifications(next);
      if (!res.ok) {
        setMuted(!next);
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({
        kind: "success",
        message: next ? "Notifikasi disenyapkan." : "Notifikasi diaktifkan.",
      });
      router.refresh();
    });
  }

  return (
    <div className="card-elevated flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className={
            muted
              ? "grid h-12 w-12 place-items-center rounded-xl bg-slate-200 text-slate-500"
              : "grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-ukm-teal"
          }
        >
          {muted ? <BellOff size={22} /> : <Bell size={22} />}
        </div>
        <div>
          <p className="text-base font-bold text-ukm-navy">
            {muted ? "Notifikasi disenyapkan" : "Notifikasi aktif"}
          </p>
          <p className="text-xs text-slate-500">
            Senyapkan semua loceng, ting, dan toast di SmartCollab. Notifikasi
            tetap disimpan, hanya tidak diumumkan.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={muted}
        aria-label="Senyapkan notifikasi"
        className={
          muted
            ? "relative inline-flex h-7 w-12 items-center rounded-full bg-slate-400 px-0.5 transition disabled:opacity-50"
            : "relative inline-flex h-7 w-12 items-center rounded-full bg-emerald-500 px-0.5 transition disabled:opacity-50"
        }
      >
        <span
          className={
            muted
              ? "block h-6 w-6 translate-x-5 transform rounded-full bg-white shadow-sm transition"
              : "block h-6 w-6 translate-x-0 transform rounded-full bg-white shadow-sm transition"
          }
        />
      </button>
    </div>
  );
}
