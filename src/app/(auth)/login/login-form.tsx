"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, GraduationCap, BookOpen, ShieldCheck, UserCog } from "lucide-react";
import { loginAction } from "./actions";

const QUICK_LOGINS = [
  { matric: "A201762", password: "Student123", labelKey: "asStudent", Icon: GraduationCap },
  { matric: "K012345", password: "Lecturer123", labelKey: "asLecturer", Icon: BookOpen },
  { matric: "K234567", password: "Lecturer123", labelKey: "asLecturer2", Icon: UserCog },
  { matric: "admin", password: "admin", labelKey: "asAdmin", Icon: ShieldCheck },
] as const;

export function LoginForm() {
  const t = useTranslations("Login");
  const tApp = useTranslations("App");
  const router = useRouter();
  const [matric, setMatric] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(creds: { matric: string; password: string }) {
    setError(null);
    startTransition(async () => {
      const res = await loginAction(creds);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-ukm-teal to-ukm-cyan text-2xl font-black text-white shadow-xl">
          U
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          <span className="text-white">UKM</span>
          <span className="text-ukm-orange">FOLIO</span>
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/70">
          {tApp("subtitle")}
        </p>
      </div>

      <div className="card-elevated animate-fade-in">
        <h2 className="mb-1 text-xl font-bold text-ukm-navy">{t("title")}</h2>
        <p className="mb-5 text-sm text-slate-500">Sila log masuk untuk meneruskan.</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit({ matric, password });
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-ukm-navy" htmlFor="matric">
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
              className="input-base uppercase"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ukm-navy" htmlFor="password">
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
                className="absolute inset-y-0 right-2 grid place-items-center text-slate-400 hover:text-ukm-navy"
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
            <a href="/forgot-password" className="text-ukm-teal hover:underline" tabIndex={-1}>
              {t("forgot")}
            </a>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-gradient-to-r from-ukm-teal to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("submitting") : t("submit")}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("quickLogin")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LOGINS.map(({ matric: m, password: p, labelKey, Icon }) => (
              <button
                key={m}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setMatric(m);
                  setPassword(p);
                  submit({ matric: m, password: p });
                }}
                className="btn-secondary flex items-center justify-center gap-2 text-xs"
              >
                <Icon size={14} />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
