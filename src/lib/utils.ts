import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string | null | undefined, locale = "ms-MY") {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined, locale = "ms-MY") {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format a date as a short BM relative phrase ("baru tadi", "5 minit lalu",
 * "2 jam lalu", "3 hari lalu", "30 Jul"). Returns "—" for null/undefined.
 */
export function relativeTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "baru tadi";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  if (day < 30) return `${Math.floor(day / 7)} minggu lalu`;
  return formatDate(date);
}

/**
 * Normalize a stored upload path to the URL the browser should load.
 *
 * Uploaded files are served through `/api/uploads/<type>/<file>` proxy routes
 * (the Docker standalone build doesn't serve runtime-written files from the
 * static `public/` folder). But the database holds a mix of formats:
 *
 *   - legacy rows:  `/uploads/avatars/x.jpg`, `/uploads/folio/x.jpg`
 *   - newer rows:   `/api/uploads/avatars/x.jpg`
 *
 * This maps any of them to the canonical `/api/uploads/<type>/<file>` form.
 * The folio save dir is singular (`/uploads/folio`) but its proxy route is
 * `/api/uploads/folios` (plural) — handled explicitly below.
 *
 * Anything already absolute (http/https) or unrecognized is returned as-is.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/api/uploads/")) return path;
  // Singular folio save dir → plural folios proxy route.
  if (path.startsWith("/uploads/folio/")) {
    return "/api/uploads/folios/" + path.slice("/uploads/folio/".length);
  }
  if (path.startsWith("/uploads/")) {
    return "/api/uploads/" + path.slice("/uploads/".length);
  }
  return path;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
