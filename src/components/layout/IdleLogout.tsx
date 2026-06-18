"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const WARN_BEFORE_MS = 60_000; // show countdown 60s before logout

/**
 * Logs the user out after 10 minutes of inactivity (no mouse, key, scroll,
 * touch, or click). A 60-second countdown banner appears first so the user
 * can dismiss it by simply moving — clicking "Stay" resets the timer;
 * otherwise the form posts to /logout when the countdown reaches 0.
 *
 * The idle clock runs regardless of whether the tab is foreground or
 * background: leaving the page open and untouched for 10 minutes logs out
 * even if it was in a background tab the whole time.
 *
 * Closing the tab or browser window signs the user out too — but a plain F5
 * refresh must NOT (the whole app is built around "refresh keeps your place").
 * The browser fires the same `pagehide` for both, so we distinguish them with
 * a localStorage stamp written on unload:
 *
 *   - On `pagehide` we stamp `left-at = now` (we do NOT log out yet).
 *   - A refresh re-runs this effect within milliseconds; the new load reports
 *     navigation type "reload", so we just clear the stamp and stay signed in.
 *   - A real close never reloads, so the stamp persists. The next time the app
 *     is opened with a still-valid session, we see the stamp and immediately
 *     sign out, forcing a fresh login.
 *
 * The 10-minute idle JWT bounds how long a session can survive between a real
 * close and the next visit.
 */
export const LEFT_AT_KEY = "ukmfolio:left-at";

/**
 * POST /logout via a hidden form (matches the existing LogoutButton). `reason`
 * lets the login page explain why ("idle" shows the bilingual timeout notice;
 * "closed" is a silent re-login after a tab close).
 */
function submitLogout(reason: "idle" | "closed") {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/logout";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "reason";
  input.value = reason;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
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

    // Hard logout exactly at the timeout. Clear the close-stamp first so the
    // idle redirect to /login isn't then re-read as a "reopened after close".
    idleTimerRef.current = setTimeout(() => {
      try {
        localStorage.removeItem(LEFT_AT_KEY);
      } catch {
        /* ignore */
      }
      submitLogout("idle");
    }, IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    // --- Tab-close detection (see component docstring) ---------------------
    // If we arrived NOT via a reload but a "left-at" stamp is present, the
    // previous session ended by closing the tab — sign out now and stop.
    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const arrivedByReload = navEntry?.type === "reload";

    let leftAt: string | null = null;
    try {
      leftAt = localStorage.getItem(LEFT_AT_KEY);
      // Either way, clear the stamp: a live tab should never carry one.
      localStorage.removeItem(LEFT_AT_KEY);
    } catch {
      /* storage may be unavailable (private mode, etc.) */
    }

    if (leftAt && !arrivedByReload) {
      // Reopened after a real close → force re-login.
      submitLogout("closed");
      return;
    }

    arm();
    // Genuine user-interaction events only. `visibilitychange` is deliberately
    // excluded so a backgrounded tab keeps counting toward the 10-minute idle
    // logout instead of resetting when the user returns.
    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    const onActivity = () => arm();
    for (const ev of events) {
      window.addEventListener(ev, onActivity, { passive: true });
    }

    // On unload, stamp the moment we left. A refresh clears it on the next
    // mount (above); a real close leaves it set for the next visit to act on.
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return; // bfcache restore, not a real teardown
      try {
        localStorage.setItem(LEFT_AT_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearAll();
      for (const ev of events) window.removeEventListener(ev, onActivity);
      window.removeEventListener("pagehide", onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-amber-300 bg-white px-5 py-3 shadow-lift-lg">
      <div className="flex items-center gap-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700">
          <Clock size={18} />
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
