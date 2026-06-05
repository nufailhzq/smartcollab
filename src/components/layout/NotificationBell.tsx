"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/actions/notifications";

/**
 * Map the short legacy tags that earlier server actions used as `link`
 * payloads to real URLs. `"chat"` opens the messenger bubble via the same
 * custom event the bubble already listens for; everything else routes
 * normally with the Next router.
 */
function resolveLink(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("/")) return link;
  if (link === "chat") return "chat:open";
  if (link === "warning") return "/student";
  return null;
}

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
  /** When true: hides the unread badge + replaces dropdown with mute banner. */
  notificationsMuted?: boolean;
};

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
  notificationsMuted = false,
}: Props) {
  const effectiveUnreadCount = notificationsMuted ? 0 : initialUnreadCount;
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

  const handleOpen = (n: BellNotification) => {
    const resolved = resolveLink(n.link);
    // Always mark read on click — even if there's no destination.
    if (!n.isRead) {
      startTransition(async () => {
        await markNotificationRead({ id: n.id });
        router.refresh();
      });
    }
    setOpen(false);

    if (!resolved) return;

    if (resolved === "chat:open") {
      // Dispatch the same event the messenger bubble already listens for to
      // pop open. Fall back to the dashboard if the listener isn't mounted.
      window.dispatchEvent(new CustomEvent("ukmfolio:open-messenger"));
      return;
    }
    router.push(resolved);
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
        {effectiveUnreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-ukm-orange px-1 text-[10px] font-bold text-white shadow-sm">
            {effectiveUnreadCount > 99 ? "99+" : effectiveUnreadCount}
          </span>
        )}
        {notificationsMuted && (
          <span
            className="absolute -right-0.5 -bottom-0.5 grid h-3 w-3 place-items-center rounded-full bg-slate-500 ring-2 ring-white"
            title="Notifikasi disenyapkan"
          />
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

          {notificationsMuted && (
            <div className="border-b border-slate-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800">
              🔕 Notifikasi disenyapkan. Buka di profil untuk aktifkan semula.
            </div>
          )}

          <ul className="max-h-[420px] overflow-y-auto">
            {initialNotifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-slate-400">
                Tiada notifikasi
              </li>
            ) : (
              initialNotifications.map((n) => {
                const hasLink = resolveLink(n.link) !== null;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "border-b border-slate-100 last:border-b-0",
                      !n.isRead && "bg-orange-50/50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      disabled={pending}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left transition",
                        hasLink && "hover:bg-sky-50/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ukm-navy">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-ukm-orange" />
                        )}
                      </div>
                      {n.message && (
                        <p className="whitespace-pre-line text-xs text-slate-600">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{formatDateTime(n.createdAt)}</span>
                        {hasLink && (
                          <span className="font-medium text-ukm-teal">
                            Lihat →
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
