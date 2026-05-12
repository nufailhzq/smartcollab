"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/actions/notifications";

export type BellNotification = {
  id: number;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  initialNotifications: BellNotification[];
  initialUnreadCount: number;
};

export function NotificationBell({ initialNotifications, initialUnreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleMarkOne = (id: number) => {
    startTransition(async () => {
      await markNotificationRead({ id });
      router.refresh();
    });
  };

  const handleMarkAll = () => {
    if (initialUnreadCount === 0) return;
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
      >
        <Bell size={18} />
        {initialUnreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-ukm-orange px-1 text-[10px] font-bold text-white shadow-sm">
            {initialUnreadCount > 99 ? "99+" : initialUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,39,68,0.15)] animate-fade-in"
        >
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-ukm-navy">Notifikasi</h3>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={pending || initialUnreadCount === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ukm-teal hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={14} /> Tandakan semua
            </button>
          </header>

          <ul className="max-h-[420px] overflow-y-auto">
            {initialNotifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-slate-400">
                Tiada notifikasi
              </li>
            ) : (
              initialNotifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-slate-100 px-4 py-3 last:border-b-0",
                    !n.isRead && "bg-orange-50/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ukm-navy">{n.title}</p>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkOne(n.id)}
                        disabled={pending}
                        className="shrink-0 text-[10px] font-medium text-ukm-teal hover:underline disabled:opacity-40"
                      >
                        Tandakan dibaca
                      </button>
                    )}
                  </div>
                  {n.message && (
                    <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDateTime(n.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
