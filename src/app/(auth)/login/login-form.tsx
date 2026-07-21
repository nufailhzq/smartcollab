"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginAction } from "./actions";
import { SmartCollabLoader } from "@/components/common/SmartCollabLoader";
import { IdleLogoutNotice } from "@/components/layout/IdleLogoutNotice";
import { LEFT_AT_KEY } from "@/components/layout/IdleLogout";

// Split-screen "I-KOM"-style login. Left = SmartCollab branding panel; right =
// clean login card. Authentication is unchanged — it still logs in by matric
// number via the existing loginAction (NextAuth Credentials).
export function LoginForm() {
  const t = useTranslations("Login");
  const [matric, setMatric] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [loggingIn, setLoggingIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  function submit(creds: { matric: string; password: string }) {
    setError(null);
    startTransition(async () => {
      const res = await loginAction(creds);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUserName(res.name);
      setLoggingIn(true);
      // A fresh login is never a "reopened after tab close". Clear any stale
      // close-stamp a previous session left in localStorage, otherwise IdleLogout
      // mounts on "/" (navigationType "navigate", not "reload"), sees the stamp,
      // and immediately logs the user back out — the classic login-twice bug.
      try {
        localStorage.removeItem(LEFT_AT_KEY);
      } catch {
        /* storage may be unavailable (private mode, etc.) */
      }
      // Hard navigation so the freshly-set session cookie is sent on "/".
      setTimeout(() => {
        window.location.href = "/";
      }, 3400);
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white lg:flex-row">
      {loggingIn && (
        <SmartCollabLoader variant="fullscreen" userName={userName ?? "kawan"} />
      )}

      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-slate-50 px-10 py-12 lg:flex lg:w-1/2">
        {/* dotted texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          {/* Institutional logos */}
          <div className="mb-8 flex items-center gap-5">
            <Image
              src="/images/logo/UKMOfficialLogo.png"
              alt="UKM"
              width={64}
              height={64}
              priority
              className="h-14 w-auto object-contain"
            />
            <Image
              src="/images/logo/ftsm_logo.png"
              alt="FTSM"
              width={64}
              height={64}
              priority
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* SmartCollab logo + title */}
          <Image
            src="/images/logo/SmartCollab_LogoNew.png"
            alt="SmartCollab"
            width={220}
            height={220}
            priority
            className="h-36 w-auto object-contain drop-shadow"
          />
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-ukm-navy">
            Smart<span className="text-ukm-orange">Collab</span>
          </h1>
          <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
            Sistem Kolaborasi Pintar
            <br />
            Peningkatan LMS UKMFolio
          </p>

          <p className="mt-12 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
            Fakulti Teknologi &amp; Sains Maklumat
          </p>
        </div>
      </aside>

      {/* ── Right login card ────────────────────────────────────────────── */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-100 px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile-only compact brand header (left panel is hidden on mobile) */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Image
              src="/images/logo/SmartCollab_LogoNew.png"
              alt="SmartCollab"
              width={80}
              height={80}
              priority
              className="h-16 w-auto object-contain"
            />
            <h1 className="mt-3 font-display text-2xl font-extrabold text-ukm-navy">
              Smart<span className="text-ukm-orange">Collab</span>
            </h1>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-[0_10px_40px_rgba(15,39,68,0.12)] sm:p-9">
            <h2 className="text-3xl font-extrabold text-ukm-navy">{t("title")}</h2>
            <p className="mb-7 mt-1.5 text-sm text-slate-500">
              Sila masukkan maklumat akaun anda
            </p>

            <IdleLogoutNotice />

            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                submit({ matric, password });
              }}
            >
              <div>
                <label
                  className="mb-1.5 block text-sm font-bold text-ukm-navy"
                  htmlFor="matric"
                >
                  No. Matrik / E-mel
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute inset-y-0 left-3 my-auto text-slate-400"
                  />
                  <input
                    id="matric"
                    name="matric"
                    autoComplete="username"
                    required
                    autoFocus
                    placeholder={t("matricPlaceholder")}
                    value={matric}
                    onChange={(e) => setMatric(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 font-mono uppercase tracking-wider text-ukm-navy transition focus:border-ukm-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-ukm-teal/30"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-bold text-ukm-navy"
                  htmlFor="password"
                >
                  {t("password")}
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute inset-y-0 left-3 my-auto text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-ukm-navy transition focus:border-ukm-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-ukm-teal/30"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Sembunyi kata laluan" : "Tunjuk kata laluan"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-ukm-navy"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex select-none items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-ukm-teal focus:ring-ukm-teal"
                  />
                  {t("remember")}
                </label>
                <Link
                  href="/forgot-password"
                  className="font-semibold text-ukm-teal transition-colors hover:text-sky-700 hover:underline"
                >
                  {t("forgot")}
                </Link>
              </div>

              {error && (
                <div
                  role="alert"
                  className="animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-ukm-navy px-4 py-3.5 text-base font-bold text-white shadow-lg transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:bg-[#12304a] hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? t("submitting") : t("submit")}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            © Nufail Haziq · SmartCollab Enhancement of UKMFolio
          </p>
        </div>
      </section>
    </div>
  );
}
