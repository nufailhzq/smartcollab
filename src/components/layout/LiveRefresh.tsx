"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Turns the live "refresh" SSE signal (dispatched by MessageStream as the
 * `ukmfolio:refresh` window event) into a debounced router.refresh(), so the
 * page the user is on silently re-fetches its Server Component data when
 * something relevant changes — no manual F5.
 *
 * Reuses MessageStream's single EventSource (no second connection). Debounced
 * so a burst of events (e.g. a fan-out notification to many rows) collapses
 * into one refresh. If the tab is hidden we defer the refresh until it's
 * visible again, avoiding wasted re-renders in background tabs.
 */
export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWhileHidden = useRef(false);

  useEffect(() => {
    const doRefresh = () => {
      if (document.visibilityState === "hidden") {
        pendingWhileHidden.current = true;
        return;
      }
      router.refresh();
    };

    const onSignal = () => {
      if (timer.current) clearTimeout(timer.current);
      // Small debounce collapses bursty fan-outs into a single refresh.
      timer.current = setTimeout(doRefresh, 400);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && pendingWhileHidden.current) {
        pendingWhileHidden.current = false;
        router.refresh();
      }
    };

    window.addEventListener("ukmfolio:refresh", onSignal);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("ukmfolio:refresh", onSignal);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
