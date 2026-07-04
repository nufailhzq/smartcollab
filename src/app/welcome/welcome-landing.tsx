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
//   1. Loading — top linear progress bar + logo pulse (no spinners).
//   2. Landing — dark-blue navbar (3 logos + nav + LOG IN), full-bleed hero with
//      a background video + a cross-fading image carousel under diagonal masks,
//      a centered semi-transparent banner, and left/right arrows.
// Elements spring in with a bouncy cubic-bezier. LOG IN routes to the existing
// NextAuth /login.
// ─────────────────────────────────────────────────────────────────────────────

const SLIDES = [
  "/images/backgrounds/UKM_picture1.jpeg",
  "/images/backgrounds/UKM_picture2.jpg",
  "/images/backgrounds/UKM_picture3.jpg",
] as const;

const NAV_LINKS = [
  { label: "Utama", href: "#hero" },
  { label: "Mengenai", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

export function WelcomeLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [slide, setSlide] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);

  // Phase 1 — drive the loading progress bar, then reveal the landing.
  useEffect(() => {
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 22 + 8);
      setProgress(p);
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => setLoading(false), 350);
      }
    }, 180);
    return () => clearInterval(tick);
  }, []);

  // Auto-advance the carousel once loaded.
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [loading]);

  const prev = useCallback(
    () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length),
    [],
  );
  const next = useCallback(() => setSlide((s) => (s + 1) % SLIDES.length), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ukm-navy font-sans text-white">
      {/* ── Phase 1: loading overlay ─────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ukm-navy">
          {/* top linear progress bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-ukm-teal via-sky-400 to-ukm-orange transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="wl-pulse flex items-center gap-4">
            <Image
              src="/images/logo/SmartCollab_LogoNew.png"
              alt="SmartCollab"
              width={72}
              height={72}
              priority
              className="h-16 w-16 object-contain drop-shadow-lg sm:h-20 sm:w-20"
            />
          </div>
          <p className="mt-5 text-sm font-medium uppercase tracking-[0.3em] text-white/60">
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
        {/* Navbar */}
        <header className="absolute inset-x-0 top-0 z-40 bg-ukm-navy/95 backdrop-blur-sm shadow-lg">
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
          className="fixed left-0 top-24 z-30 grid h-11 w-11 place-items-center rounded-r-xl bg-ukm-orange text-white shadow-lg transition hover:w-12"
        >
          <Settings size={18} />
        </button>

        {/* Hero */}
        <section id="hero" className="relative flex min-h-screen items-center justify-center">
          {/* Background video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/images/backgrounds/Ukm_video.mp4" type="video/mp4" />
          </video>

          {/* Diagonal-masked cross-fading image carousel over the video */}
          <div className="absolute inset-0">
            {SLIDES.map((src, i) => (
              <div
                key={src}
                className="wl-diagonal absolute inset-0 transition-opacity duration-1000 ease-out"
                style={{ opacity: i === slide ? 1 : 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Dark gradient wash for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-ukm-navy/70 via-ukm-navy/40 to-ukm-navy/80" />

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
                <div className="wl-spring inline-block rounded-2xl bg-black/45 px-6 py-5 backdrop-blur-sm sm:px-10 sm:py-7">
                  <p className="font-display text-lg font-bold uppercase leading-snug tracking-[0.15em] text-white sm:text-3xl md:text-4xl">
                    &ldquo;Mengilham Harapan, Mencipta Masa Depan&rdquo;
                  </p>
                </div>
                <div className="wl-spring-delayed mt-8">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ukm-orange to-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-glow-orange active:scale-100"
                  >
                    <LogIn size={18} /> Log Masuk ke SmartCollab
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Slaid ${i + 1}`}
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
