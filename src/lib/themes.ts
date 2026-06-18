/**
 * Single source of truth for SmartCollab UI themes.
 *
 * A theme is applied by setting `data-sb-theme="<key>"` on <html>. The matching
 * CSS custom-property token set lives in src/styles/tokens.css; the `gradient`
 * here is only used for the picker swatches and a couple of accent surfaces.
 *
 * Keep this list in sync with tokens.css — every key below must have a
 * `:root[data-sb-theme="<key>"] { ... }` block.
 */

export type ThemeMode = "light" | "dark";

export type ThemeDef = {
  key: string;
  name: string;
  mode: ThemeMode;
  /** CSS gradient used for the swatch preview and the app background wash. */
  gradient: string;
};

export const THEMES: ThemeDef[] = [
  {
    key: "aurora",
    name: "Aurora",
    mode: "light",
    gradient: "linear-gradient(135deg,#eaf2ff,#eef0ff,#fdf3ec)",
  },
  {
    key: "blush",
    name: "Rose Blush",
    mode: "light",
    gradient: "linear-gradient(135deg,#fee2e2,#fbcfe8,#fff1f2)",
  },
  {
    key: "sunset",
    name: "Sunset",
    mode: "light",
    gradient: "linear-gradient(135deg,#fef3c7,#fed7aa,#fecaca)",
  },
  {
    key: "mint",
    name: "Fresh Mint",
    mode: "light",
    gradient: "linear-gradient(135deg,#effdf6,#e0f7f1,#eefcff)",
  },
  {
    key: "midnight",
    name: "Midnight Purple",
    mode: "dark",
    gradient: "linear-gradient(135deg,#1e1b4b,#3b0764,#050208)",
  },
  {
    key: "ocean",
    name: "Deep Ocean",
    mode: "dark",
    gradient: "linear-gradient(135deg,#0c4a6e,#075985,#02161f)",
  },
  {
    key: "forest",
    name: "Forest",
    mode: "dark",
    gradient: "linear-gradient(135deg,#064e3b,#065f46,#021810)",
  },
  {
    key: "galaxy",
    name: "Galaxy",
    mode: "dark",
    gradient: "linear-gradient(135deg,#0b1020,#1e1b4b,#000000)",
  },
];

export const DEFAULT_THEME = "aurora";

export const THEME_KEYS = THEMES.map((t) => t.key);

/** localStorage key shared with the no-flash inline script in the root layout. */
export const THEME_STORAGE_KEY = "ukmfolio-theme";

export function isThemeKey(value: unknown): value is string {
  return typeof value === "string" && THEME_KEYS.includes(value);
}

/** Coerce any input to a valid theme key, falling back to the default. */
export function normalizeTheme(value: unknown): string {
  return isThemeKey(value) ? value : DEFAULT_THEME;
}

export function themeMode(key: string): ThemeMode {
  return THEMES.find((t) => t.key === key)?.mode ?? "light";
}

/**
 * Apply a theme to <html> by setting both attributes:
 *  - data-sb-theme: the specific palette (drives token sets in tokens.css)
 *  - data-sb-mode:  light|dark (drives shared dark-mode CSS in globals.css)
 * Safe to call in the browser only.
 */
export function applyThemeToDom(key: string): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-sb-theme", key);
  root.setAttribute("data-sb-mode", themeMode(key));
}
