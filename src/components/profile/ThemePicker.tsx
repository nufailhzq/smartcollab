"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Palette } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { saveTheme } from "@/server/actions/preferences";
import {
  THEMES,
  THEME_STORAGE_KEY,
  applyThemeToDom,
  normalizeTheme,
} from "@/lib/themes";

/**
 * Account-saved theme picker. Themes are hidden by default behind a "Theme"
 * button; clicking it opens a modal of swatches. Selecting a swatch:
 *   1. applies the theme live to <html> (instant preview),
 *   2. mirrors it to localStorage (no-flash on same-device reloads),
 *   3. persists it to the account via saveTheme,
 *   4. shows a "Tema disimpan" toast and closes the modal.
 *
 * `initial` is the user's saved theme (rendered server-side) so the active
 * swatch is highlighted from the first paint.
 */
export function ThemePicker({ initial }: { initial: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => normalizeTheme(initial));
  const [pending, startTransition] = useTransition();

  function choose(key: string) {
    const previous = selected;
    // 1 + 2: instant live preview + same-device persistence.
    setSelected(key);
    applyThemeToDom(key);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, key);
    } catch {
      /* private mode / quota — DB save below still persists it */
    }

    // 3 + 4: persist to the account, then toast + close.
    startTransition(async () => {
      const res = await saveTheme(key);
      if (!res.ok) {
        // Roll back the optimistic preview on failure.
        setSelected(previous);
        applyThemeToDom(previous);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, previous);
        } catch {
          /* ignore */
        }
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Tema disimpan." });
      setOpen(false);
      router.refresh();
    });
  }

  const activeName =
    THEMES.find((t) => t.key === selected)?.name ?? "Aurora";

  return (
    <div className="card-elevated flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-100 to-violet-100 text-ukm-purple">
          <Palette size={22} />
        </div>
        <div>
          <p className="text-base font-bold text-ukm-navy">Tema</p>
          <p className="text-xs text-slate-500">
            Tema semasa:{" "}
            <span className="font-semibold text-ukm-navy">{activeName}</span>.
            Pilih tema kegemaran anda — disimpan ke akaun.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ukm-navy shadow-soft transition hover:-translate-y-0.5 hover:border-ukm-purple/40 hover:shadow-glow"
      >
        Tukar Tema
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pilih Tema">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => {
            const isActive = t.key === selected;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => choose(t.key)}
                disabled={pending}
                aria-pressed={isActive}
                title={t.name}
                className={`group relative overflow-hidden rounded-xl border-2 text-left transition disabled:opacity-60 ${
                  isActive
                    ? "border-ukm-purple shadow-glow"
                    : "border-transparent hover:border-slate-300"
                }`}
              >
                <span
                  className="block h-16 w-full"
                  style={{ background: t.gradient }}
                />
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-ukm-purple shadow-sm">
                    <Check size={13} />
                  </span>
                )}
                <span className="flex items-center justify-between gap-1 bg-white px-2.5 py-1.5">
                  <span className="truncate text-xs font-semibold text-ukm-navy">
                    {t.name}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-400">
                    {t.mode === "dark" ? "Gelap" : "Terang"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
