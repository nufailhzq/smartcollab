"use client";

import { useEffect } from "react";
import { SmartCollabLoader } from "./SmartCollabLoader";

export function ProcessingOverlay({
  active,
  message,
}: {
  active: boolean;
  message?: string;
}) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (!active) return null;
  return <SmartCollabLoader variant="fullscreen" message={message} />;
}
