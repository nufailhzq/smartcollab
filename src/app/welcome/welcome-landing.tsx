"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  LogIn,
  Menu,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Pre-login landing page. Phases:
//   1. Loading — top linear progress bar + a large logo that fades in/out.
//   2. Landing — solid dark-blue navbar on top (never covered), and BELOW it a
//      hero media area. The VIDEO is the default front view; the UKM pictures
//      only fade in when the user navigates (next/prev/dots). LOG MASUK routes
//      to the existing NextAuth /login.
// ─────────────────────────────────────────────────────────────────────────────

// The carousel: index 0 = the video (default). 1..3 = the still pictures.
const PICTURES = [
  "/images/backgrounds/UKM_picture1.jpeg",
  "/images/backgrounds/UKM_picture2.jpg",
  "/images/backgrounds/UKM_picture3.jpg",
] as const;
const SLIDE_COUNT = PICTURES.length + 1; // +1 for the video slide

const NAV_LINKS = [
  { label: "Utama", href: "#hero" },
  { label: "Mengenai", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

export function WelcomeLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [slide, setSlide] = useState(0); // 0 = video, 1..3 = pictures
  const [mobileNav, setMobileNav] = useState(false);

  // Phase 1 — drive the loading progress bar, then reveal the landing.
  useEffect(() => {
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 22 + 8);
      setProgress(p);
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => setLoading(false), 400);
      }
    }, 180);
    return () => clearInterval(tick);
  }, []);

  const prev = useCallback(
    () => setSlide((s) => (s - 1 + SLIDE_COUNT) % SLIDE_COUNT),
    [],
  );
  const next = useCallback(() => setSlide((s) => (s + 1) % SLIDE_COUNT), []);

  return (
    <div className="relative min-h-screen bg-ukm-navy font-sans text-white">
      {/* ── Phase 1: loading overlay — big logo that fades in/out ─────────── */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ukm-navy">
          {/* top linear progress bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-ukm-teal via-sky-400 to-ukm-orange transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Image
            src="/images/logo/SmartCollab_LogoNew.png"
            alt="SmartCollab"
            width={180}
            height={180}
            priority
            className="wl-fade h-28 w-28 object-contain drop-shadow-2xl sm:h-36 sm:w-36"
          />
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/60">
            Memuatkan…
          </p>
        </div>
      )}

      {/* ── Phase 2: landing ─────────────────────────────────────────────── */}
      <div
        className={
          loading ? "pointer-events-none opacity-0" : "opacity-100 transition-opacity duration-500"
        }
      >
        {/* Navbar — solid, on top, sticky. Media sits BELOW it. */}
        <header className="sticky top-0 z-50 bg-ukm-navy shadow-lg">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
            {/* Left — three institutional logos */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Logo src="/images/logo/SmartCollab_LogoNew.png" alt="SmartCollab" />
              <span className="hidden h-8 w-px bg-white/20 sm:block" />
              <Logo src="/images/logo/UKMOfficialLogo.png" alt="UKM" />
              <Logo src="/images/logo/ftsm_logo.png" alt="FTSM" />
            </div>

            {/* Right — nav + LOG IN (desktop) */}
            <nav className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
              <span className="text-sm font-medium text-white/50">EN</span>
              <Link
                href="/login"
                className="wl-spring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ukm-orange to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-glow-orange"
              >
                <LogIn size={16} /> LOG MASUK
              </Link>
            </nav>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileNav((v) => !v)}
              className="rounded-lg p-2 text-white md:hidden"
              aria-label="Menu"
            >
              {mobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileNav && (
            <div className="border-t border-white/10 bg-ukm-navy px-4 py-3 md:hidden">
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileNav(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
                  >
                    {l.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-ukm-orange to-orange-500 px-5 py-2.5 text-sm font-bold text-white"
                >
                  <LogIn size={16} /> LOG MASUK
                </Link>
              </nav>
            </div>
          )}
        </header>

        {/* Sticky setting cog on the left edge, just below the navbar */}
        <button
          type="button"
          aria-label="Tetapan"
          className="fixed left-0 top-24 z-40 grid h-11 w-11 place-items-center rounded-r-xl bg-ukm-orange text-white shadow-lg transition hover:w-12"
        >
          <Settings size={18} />
        </button>

        {/* Hero — media area sits BELOW the navbar (min-h minus navbar height) */}
        <section
          id="hero"
          className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden sm:min-h-[calc(100vh-5rem)]"
        >
          {/* Base layer: the VIDEO — always present, the default front view. */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/images/backgrounds/Ukm_video.mp4" type="video/mp4" />
          </video>

          {/* Picture layers — fade IN only when the user navigates to them
              (slide 1..3). Slide 0 keeps only the video visible. */}
          <div className="absolute inset-0">
            {PICTURES.map((src, i) => (
              <div
                key={src}
                className="absolute inset-0 transition-opacity duration-700 ease-out"
                style={{ opacity: slide === i + 1 ? 1 : 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Dark gradient wash for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-ukm-navy/60 via-ukm-navy/35 to-ukm-navy/75" />

          {/* Arrows */}
          <button
            type="button"
            onClick={prev}
            aria-label="Sebelumnya"
            className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:left-6"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Seterusnya"
            className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:right-6"
          >
            <ChevronRight size={24} />
          </button>

          {/* Centered banner + CTA */}
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            {!loading && (
              <>
                <p className="wl-spring mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-ukm-orange sm:text-sm">
                  Universiti Kebangsaan Malaysia
                </p>
                <h1 className="wl-spring font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
                  Mengilham Harapan,
                  <br />
                  <span className="bg-gradient-to-r from-ukm-orange via-amber-300 to-ukm-orange bg-clip-text text-transparent">
                    Mencipta Masa Depan
                  </span>
                </h1>
                <p className="wl-spring-delayed mx-auto mt-5 max-w-xl text-sm font-medium text-white/80 sm:text-base">
                  Platform kolaborasi pintar untuk pembelajaran, kumpulan, dan komuniti UKMFolio.
                </p>
                <div className="wl-spring-delayed mt-9">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-ukm-orange to-orange-500 px-9 py-4 text-base font-bold text-white shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-glow-orange active:scale-100"
                  >
                    <LogIn size={18} /> Log Masuk ke SmartCollab
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Slide dots — first dot = video, rest = pictures */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={i === 0 ? "Video" : `Gambar ${i}`}
                className={
                  i === slide
                    ? "h-2.5 w-8 rounded-full bg-ukm-orange transition-all"
                    : "h-2.5 w-2.5 rounded-full bg-white/40 transition-all hover:bg-white/70"
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Logo({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={44}
      height={44}
      priority
      className="h-8 w-auto object-contain sm:h-10"
    />
  );
}
