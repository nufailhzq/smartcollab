"use client";

import { useEffect } from "react";
import { applyThemeToDom, normalizeTheme, THEME_STORAGE_KEY } from "@/lib/themes";

/**
 * Reconciles the account-saved theme (rendered from the DB and passed as
 * `theme`) with the DOM and localStorage on every authenticated page load.
 *
 * The root layout's inline script prevents a flash by reading localStorage
 * before paint; this then makes the DB the source of truth — so a user who
 * changed their theme on another device sees it here after the first paint,
 * and localStorage is kept in sync for the next no-flash reload.
 *
 * Renders nothing.
 */
export function ThemeApplier({ theme }: { theme: string }) {
  useEffect(() => {
    const key = normalizeTheme(theme);
    applyThemeToDom(key);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, key);
    } catch {
      /* private mode / quota — DOM is still correct for this session */
    }
  }, [theme]);

  return null;
}
