"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const WARN_BEFORE_MS = 60_000; // show countdown 60s before logout

/**
 * Logs the user out after 10 minutes of inactivity (no mouse, key, scroll,
 * touch, or visibility change). A 60-second countdown banner appears first
 * so the user can dismiss it by simply moving — clicking "Stay" resets the
 * timer; otherwise the form posts to /logout when the countdown reaches 0.
 *
 * Tabs that go to the background (visibilitychange → hidden) also pause the
 * timer; resuming visibility resets it so the user isn't logged out solely
 * for switching tabs.
 */
export function IdleLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARN_BEFORE_MS / 1000);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearAll() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    idleTimerRef.current = null;
    warnTimerRef.current = null;
    tickRef.current = null;
  }

  function arm() {
    clearAll();
    setShowWarning(false);
    // Fire the warning at (timeout - 60s) so the user has 60s to react.
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(WARN_BEFORE_MS / 1000);
      tickRef.current = setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS);

    // Hard logout exactly at the timeout.
    idleTimerRef.current = setTimeout(() => {
      // Build a hidden form to POST /logout (matches existing LogoutButton).
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/logout";
      document.body.appendChild(form);
      form.submit();
    }, IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    arm();
    const events = [
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "visibilitychange",
    ];
    const onActivity = () => {
      if (document.visibilityState === "hidden") return; // ignore background
      arm();
    };
    for (const ev of events) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    return () => {
      clearAll();
      for (const ev of events) window.removeEventListener(ev, onActivity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-amber-300 bg-white px-5 py-3 shadow-lift-lg">
      <div className="flex items-center gap-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700">
          ⏰
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-ukm-navy">
            Anda akan log keluar dalam {secondsLeft}s
          </p>
          <p className="text-xs text-slate-500">
            Tiada aktiviti dikesan selama 10 minit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => arm()}
          className="rounded-lg bg-gradient-to-br from-ukm-teal to-sky-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:-translate-y-0.5"
        >
          Kekal log masuk
        </button>
      </div>
    </div>
  );
}
