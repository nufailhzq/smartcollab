"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Hash,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/common/Avatar";

type Props = {
  code: string;
  title: string;
  lecturerId?: number | null;
  lecturerName?: string | null;
  lecturerMatric?: string | null;
  lecturerAvatarPath?: string | null;
  lecturerEmail?: string | null;
  lecturerPhone?: string | null;
  semester?: string | null;
  creditHours?: number | null;
  href: string;
  ctaLabel?: string;
  variant?: "default" | "showcase";
};

const SHOWCASE_THEMES = [
  {
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    chip: "bg-white/95 text-sky-700",
    button: "from-sky-500 to-teal-500",
    glow: "group-hover/sc:shadow-[0_22px_55px_-15px_rgba(14,165,233,0.55)]",
    icon: "text-sky-600",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    gradient: "from-orange-500 via-rose-500 to-pink-500",
    chip: "bg-white/95 text-orange-700",
    button: "from-orange-500 to-pink-500",
    glow: "group-hover/sc:shadow-[0_22px_55px_-15px_rgba(244,63,94,0.55)]",
    icon: "text-orange-600",
    badge: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  {
    gradient: "from-indigo-500 via-purple-500 to-fuchsia-500",
    chip: "bg-white/95 text-indigo-700",
    button: "from-indigo-500 to-fuchsia-500",
    glow: "group-hover/sc:shadow-[0_22px_55px_-15px_rgba(139,92,246,0.55)]",
    icon: "text-indigo-600",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    chip: "bg-white/95 text-emerald-700",
    button: "from-emerald-500 to-lime-500",
    glow: "group-hover/sc:shadow-[0_22px_55px_-15px_rgba(16,185,129,0.55)]",
    icon: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    chip: "bg-white/95 text-amber-700",
    button: "from-amber-500 to-orange-500",
    glow: "group-hover/sc:shadow-[0_22px_55px_-15px_rgba(245,158,11,0.55)]",
    icon: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    gradient: "from-blue-500 via-violet-500 to-purple-500",
    chip: "bg-white/95 text-blue-700",
    button: "from-blue-500 to-purple-500",
    glow: "group-hover/sc:shadow-[0_22px_55px_-15px_rgba(59,130,246,0.55)]",
    icon: "text-blue-600",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
  },
];

function pickTheme(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return SHOWCASE_THEMES[Math.abs(h) % SHOWCASE_THEMES.length]!;
}

export function CourseCard({
  code,
  title,
  lecturerId,
  lecturerName,
  lecturerMatric,
  lecturerAvatarPath,
  lecturerEmail,
  lecturerPhone,
  semester,
  creditHours,
  href,
  ctaLabel = "Lihat Kursus",
  variant = "default",
}: Props) {
  // Tap-to-expand on mobile (default variant only). Hook stays before any early return.
  const [expanded, setExpanded] = useState(false);

  if (variant === "showcase") {
    const theme = pickTheme(code);
    return (
      <Link
        href={href}
        className={`group/sc relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-all duration-500 ease-spring hover:-translate-y-2 hover:border-transparent ${theme.glow}`}
      >
        {/* Gradient banner */}
        <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
          {/* Decorative blobs */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/25 blur-2xl transition-transform duration-700 ease-spring group-hover/sc:scale-150" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-black/15 blur-3xl transition-transform duration-700 ease-spring group-hover/sc:scale-125" />

          {/* Dotted pattern overlay */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Sweeping shine on hover */}
          <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-1000 ease-out group-hover/sc:left-[120%] group-hover/sc:opacity-100" />

          {/* Top row: code chip + semester */}
          <div className="relative flex items-start justify-between p-5">
            <span
              className={`inline-flex items-center rounded-lg px-3 py-1.5 font-mono text-sm font-bold shadow-soft ${theme.chip} transition-transform duration-300 ease-spring group-hover/sc:-translate-y-0.5 group-hover/sc:scale-105`}
            >
              {code}
            </span>
            {semester && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                <Clock size={11} /> {semester}
              </span>
            )}
          </div>

          {/* Floating icon pill */}
          <div className="absolute -bottom-8 right-5 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-lift transition-all duration-500 ease-spring group-hover/sc:-translate-y-2 group-hover/sc:rotate-6">
            <BookOpen size={28} strokeWidth={2.4} className={theme.icon} />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-white shadow-soft opacity-0 transition-all duration-300 group-hover/sc:opacity-100 group-hover/sc:animate-glow-pulse">
              <Sparkles size={11} />
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-7">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-ukm-navy transition-colors duration-300 group-hover/sc:text-ukm-orange sm:text-xl">
            {title}
          </h3>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={lecturerName ?? "—"}
              avatarPath={lecturerAvatarPath ?? null}
              size="sm"
              ring
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pensyarah
              </p>
              <p className="truncate text-sm font-medium text-slate-700">
                {lecturerName ?? "Tidak ditetapkan"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${theme.badge}`}
            >
              <GraduationCap size={12} />
              {creditHours ? `${creditHours} jam kredit` : "Kursus aktif"}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${theme.button} px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft transition-all duration-300 ease-spring group-hover/sc:gap-2 group-hover/sc:shadow-lift`}
            >
              {ctaLabel}
              <ArrowRight
                size={13}
                className="transition-transform duration-300 ease-spring group-hover/sc:translate-x-1"
              />
            </span>
          </div>
        </div>

        {/* Hover overlay — rich lecturer detail. Slowly pulls up from the bottom on hover. */}
        <div className="pointer-events-none absolute inset-0 z-20 flex translate-y-full flex-col overflow-hidden rounded-2xl bg-white opacity-0 transition-all duration-700 ease-spring group-hover/sc:pointer-events-auto group-hover/sc:translate-y-0 group-hover/sc:opacity-100">
          {/* Header: code + title */}
          <div className={`bg-gradient-to-r ${theme.gradient} px-4 py-3`}>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-xs font-bold shadow-soft ${theme.chip}`}
              >
                {code}
              </span>
              {semester && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  <Clock size={10} /> {semester}
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-white">
              {title}
            </p>
          </div>

          {/* Body: big avatar + lecturer info */}
          <div className="flex flex-1 items-start gap-4 px-4 py-3">
            <Avatar
              name={lecturerName ?? "—"}
              avatarPath={lecturerAvatarPath ?? null}
              size="2xl"
              ring
              className="h-36 w-36 text-4xl"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pensyarah
              </p>
              <p className="truncate text-sm font-bold text-ukm-navy">
                {lecturerName ?? "Tidak ditetapkan"}
              </p>
              {lecturerMatric && (
                <p className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <Hash size={10} className="text-slate-400" />
                  {lecturerMatric}
                </p>
              )}
              {lecturerEmail && (
                <p className="flex items-center gap-1 text-[11px] text-slate-600">
                  <Mail size={10} className="shrink-0 text-slate-400" />
                  <span className="truncate">{lecturerEmail}</span>
                </p>
              )}
              {lecturerPhone && (
                <p className="flex items-center gap-1 text-[11px] text-slate-600">
                  <Phone size={10} className="shrink-0 text-slate-400" />
                  {lecturerPhone}
                </p>
              )}
            </div>
          </div>

          {/* Footer: view course + message buttons */}
          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <Link
              href={href}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r ${theme.button} px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift`}
            >
              {ctaLabel}
              <ArrowRight size={13} />
            </Link>
            {lecturerId && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("ukmfolio:open-dm", {
                      detail: { userId: lecturerId },
                    }),
                  );
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ukm-navy shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <MessageSquare size={13} /> Mesej
              </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article
      className={`group/card relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-ukm-teal/40 hover:shadow-glow ${
        expanded ? "ring-2 ring-ukm-teal/40" : ""
      }`}
    >
      {/* Gradient halo on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-ukm-teal/10 via-transparent to-ukm-orange/10 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
          <span className="rounded-md bg-orange-100 px-2 py-1 font-mono font-semibold text-ukm-orange transition-transform duration-300 group-hover/card:scale-105">
            {code}
          </span>
          {semester && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} className="text-slate-400" />
              {semester}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-1 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-50 transition-all duration-300 ease-spring group-hover/card:scale-110 group-hover/card:bg-ukm-teal/15">
            <BookOpen
              size={18}
              className="text-ukm-teal transition-transform duration-300 group-hover/card:rotate-6"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ukm-navy">
              {title}
            </h3>
            {lecturerName && (
              <p className="mt-1 text-xs text-slate-500">{lecturerName}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {creditHours ? `${creditHours} jam kredit` : ""}
          </span>
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ukm-teal transition-colors hover:bg-sky-50"
          >
            {ctaLabel}{" "}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover/card:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Mobile tap toggle (hidden on lg where hover works) */}
        <button
          type="button"
          aria-label="Tunjuk butiran kursus"
          aria-expanded={expanded}
          onClick={(e) => {
            e.preventDefault();
            setExpanded((v) => !v);
          }}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-400 shadow-soft transition hover:text-ukm-teal lg:hidden"
        >
          <Sparkles size={13} />
        </button>
      </div>

      {/* Hover/expanded overlay — slides up from bottom showing the lecturer info */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-white via-white/97 to-white/0 px-5 pb-5 pt-8 opacity-0 transition-all duration-300 ease-spring group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100 ${
          expanded ? "pointer-events-auto !translate-y-0 !opacity-100" : ""
        }`}
      >
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lift backdrop-blur-sm">
          <Avatar
            name={lecturerName ?? "—"}
            avatarPath={lecturerAvatarPath ?? null}
            size="md"
            ring
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Pensyarah</p>
            <p className="truncate text-sm font-semibold text-ukm-navy">
              {lecturerName ?? "Tidak ditetapkan"}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-ukm-orange">
              {code} · {title}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
