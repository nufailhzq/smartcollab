"use client";

import { useState, useTransition } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  requestChangePasswordCode,
  changePasswordWithCode,
} from "@/server/actions/password-reset";

// ─────────────────────────────────────────────────────────────────────────────
// Profile "Tukar Kata Laluan": step 1 emails a 6-digit code to the account
// owner; step 2 verifies the code + sets the new password.
// ─────────────────────────────────────────────────────────────────────────────

export function ChangePasswordCard() {
  const toast = useToast();
  const [stage, setStage] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isPending, startTransition] = useTransition();

  function requestCode() {
    startTransition(async () => {
      const res = await requestChangePasswordCode();
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kod telah dihantar ke e-mel anda." });
      setStage("code");
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.push({ kind: "error", message: "Kata laluan tidak sepadan." });
      return;
    }
    startTransition(async () => {
      const res = await changePasswordWithCode({ code, password, confirm });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kata laluan berjaya ditukar." });
      setStage("idle");
      setCode("");
      setPassword("");
      setConfirm("");
    });
  }

  return (
    <section className="card space-y-3">
      <header className="flex items-center gap-2">
        <KeyRound className="text-ukm-teal" size={18} />
        <h2 className="text-base font-semibold text-ukm-navy">Tukar Kata Laluan</h2>
      </header>

      {stage === "idle" ? (
        <>
          <p className="text-sm text-slate-500">
            Untuk keselamatan, kami akan menghantar kod pengesahan 6 digit ke e-mel anda sebelum
            menukar kata laluan.
          </p>
          <button
            type="button"
            onClick={requestCode}
            disabled={isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isPending ? <LoadingSpinner /> : <KeyRound size={16} />}
            Hantar Kod ke E-mel
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Kod Pengesahan (6 digit)
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              required
              className="input-base max-w-[200px] font-mono tracking-[0.4em]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Kata Laluan Baharu
            </label>
            <div className="relative max-w-sm">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-2 grid place-items-center px-1 text-slate-400 hover:text-ukm-navy"
                aria-label={show ? "Sembunyi" : "Tunjuk"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Sahkan Kata Laluan
            </label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="input-base max-w-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isPending} className="btn-primary inline-flex items-center gap-2">
              {isPending ? <LoadingSpinner /> : null}
              Tukar Kata Laluan
            </button>
            <button
              type="button"
              onClick={requestCode}
              disabled={isPending}
              className="btn-secondary text-xs"
            >
              Hantar Semula Kod
            </button>
            <button
              type="button"
              onClick={() => setStage("idle")}
              disabled={isPending}
              className="btn-secondary text-xs"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
