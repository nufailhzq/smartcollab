"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { loginAction } from "./actions";
import { SmartCollabLoader } from "@/components/common/SmartCollabLoader";
import { IdleLogoutNotice } from "@/components/layout/IdleLogoutNotice";

export function LoginForm() {
  const t = useTranslations("Login");
  const tApp = useTranslations("App");
  const router = useRouter();
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
      // Delay the navigation so the user sees the
      // "Connecting → Welcome <name>" narration before the page transitions.
      // SmartCollabLoader sequence: 1.8s connect → 1.4s welcome → 1.2s fade.
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 3400);
    });
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      {loggingIn && (
        <SmartCollabLoader
          variant="fullscreen"
          userName={userName ?? "kawan"}
        />
      )}
      {/* Brand header */}
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="group/logo relative mb-4">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-ukm-teal/40 to-ukm-cyan/30 opacity-60 blur-xl transition-all duration-500 group-hover/logo:opacity-100 group-hover/logo:blur-2xl" />
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white p-2.5 shadow-lift-lg transition-transform duration-500 ease-spring group-hover/logo:scale-105 group-hover/logo:-rotate-3">
            <Image
              src="/images/logo/UKMOfficialLogo.png"
              alt="UKM"
              width={72}
              height={72}
              priority
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
          <span className="text-white">Smart</span>
          <span className="bg-gradient-to-r from-ukm-orange to-orange-400 bg-clip-text text-transparent">
            Collab
          </span>
        </h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">
          <Sparkles size={11} className="text-ukm-cyan" />
          UKMFolio Enhancement
        </p>
      </div>

      {/* Login card with hover lift + glow */}
      <div className="group/card relative">
        <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-ukm-teal/30 via-ukm-cyan/20 to-ukm-orange/20 opacity-0 blur-2xl transition-all duration-500 group-hover/card:opacity-100" />
        <div className="relative rounded-2xl border border-white/20 bg-white/95 p-6 shadow-lift-lg backdrop-blur-xl transition-all duration-300 ease-spring group-hover/card:-translate-y-1 group-hover/card:shadow-glow group-hover/card:border-ukm-teal/30 sm:p-7">
          <h2 className="text-xl font-bold text-ukm-navy">{t("title")}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Sila log masuk untuk meneruskan.</p>

          <IdleLogoutNotice />

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit({ matric, password });
            }}
          >
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ukm-navy"
                htmlFor="matric"
              >
                {t("matric")}
              </label>
              <input
                id="matric"
                name="matric"
                autoComplete="username"
                required
                autoFocus
                placeholder={t("matricPlaceholder")}
                value={matric}
                onChange={(e) => setMatric(e.target.value.toUpperCase())}
                className="input-base uppercase font-mono tracking-wider"
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ukm-navy"
                htmlFor="password"
              >
                {t("password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyi kata laluan" : "Tunjuk kata laluan"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ukm-navy"
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
              <a
                href="/forgot-password"
                className="font-medium text-ukm-teal transition-colors hover:text-sky-700 hover:underline"
                tabIndex={-1}
              >
                {t("forgot")}
              </a>
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
              className="group/btn relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-ukm-teal via-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span className="relative z-10">{isPending ? t("submitting") : t("submit")}</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
            </button>
          </form>
        </div>
      </div>

      <p className="mt-5 text-center text-[11px] text-white/60">
        © Nufail Haziq · SmartCollab Enhancement of UKMFolio
      </p>
    </div>
  );
}
