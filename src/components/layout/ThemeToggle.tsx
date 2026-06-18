"use client";

import { useEffect, useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { applyThemeToDom, themeMode, THEME_STORAGE_KEY } from "@/lib/themes";
import { saveTheme } from "@/server/actions/preferences";

/**
 * Quick light/dark flip in the navbar. Independent of the profile ThemePicker
 * but writes the same state: it flips between aurora (light) and midnight
 * (dark), updates <html>, mirrors to localStorage, and persists to the account.
 *
 * If the user is on one of the other themes, the toggle reflects that theme's
 * mode and flips to the canonical aurora/midnight of the opposite mode.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // The inline script in the root layout already set data-sb-mode; read it
    // back so the button reflects the real applied mode (any of the 8 themes).
    const mode = document.documentElement.getAttribute("data-sb-mode");
    setIsDark(mode === "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next = isDark ? "aurora" : "midnight";
    setIsDark(themeMode(next) === "dark");
    applyThemeToDom(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* private mode / quota — account save below still persists it */
    }
    startTransition(async () => {
      // Fire-and-forget account save; the DOM is already updated optimistically.
      await saveTheme(next).catch(() => {});
    });
  }

  const dark = mounted && isDark;

  return (
    <button
      type="button"
      onClick={toggle}
      translate="no"
      title={dark ? "Tukar ke mod terang" : "Tukar ke mod gelap"}
      aria-label="Tukar tema"
      aria-pressed={dark}
      className="notranslate group relative inline-flex h-7 w-12 items-center rounded-full border border-slate-200/70 bg-gradient-to-r from-amber-50 via-white to-slate-100 px-0.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
      style={
        dark
          ? {
              background:
                "linear-gradient(to right, #1e1b4b, #0b1020, #1a2240)",
              borderColor: "rgba(99,102,241,0.35)",
            }
          : undefined
      }
    >
      <span
        className="flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-soft transition-transform duration-300 ease-spring"
        style={{
          transform: dark ? "translateX(20px)" : "translateX(0)",
          background: dark ? "#1f2a48" : "#ffffff",
        }}
      >
        {dark ? (
          <Moon size={12} className="text-sky-300" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
