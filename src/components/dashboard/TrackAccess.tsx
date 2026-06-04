"use client";

import { useEffect, useRef } from "react";
import { trackAccess } from "@/server/actions/recent-access";
import type { TrackAccessInput } from "@/schemas/recent-access";

/**
 * Fires `trackAccess` once on mount. Render this near the top of a detail page
 * to record that the current user just visited it. Failures are silent.
 */
export function TrackAccess(props: TrackAccessInput) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackAccess(props);
    // We deliberately depend on a stable snapshot of props — re-running on
    // shallow prop change would double-count React's StrictMode dev re-mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
