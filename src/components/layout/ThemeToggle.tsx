"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "aurora" | "midnight";
const STORAGE_KEY = "ukmfolio-theme";

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-sb-theme", t);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("aurora");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Inline script in root layout has already set the attribute; read it
    // back so the button reflects the real applied theme.
    const current = document.documentElement.getAttribute("data-sb-theme");
    setTheme(current === "midnight" ? "midnight" : "aurora");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "aurora" ? "midnight" : "aurora";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / quota — preference just won't persist */
    }
  }

  const isDark = mounted && theme === "midnight";

  return (
    <button
      type="button"
      onClick={toggle}
      translate="no"
      title={isDark ? "Tukar ke mod terang" : "Tukar ke mod gelap"}
      aria-label="Tukar tema"
      aria-pressed={isDark}
      className="notranslate group relative inline-flex h-7 w-12 items-center rounded-full border border-slate-200/70 bg-gradient-to-r from-amber-50 via-white to-slate-100 px-0.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
      style={
        isDark
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
          transform: isDark ? "translateX(20px)" : "translateX(0)",
          background: isDark ? "#1f2a48" : "#ffffff",
        }}
      >
        {isDark ? (
          <Moon size={12} className="text-sky-300" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
