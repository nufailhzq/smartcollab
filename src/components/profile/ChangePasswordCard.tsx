"use client";

import { useState, useTransition } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { changePassword } from "@/server/actions/password-reset";

// ─────────────────────────────────────────────────────────────────────────────
// Profile "Tukar Kata Laluan": enter current password → set a new one.
// ─────────────────────────────────────────────────────────────────────────────

export function ChangePasswordCard() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.push({ kind: "error", message: "Kata laluan tidak sepadan." });
      return;
    }
    startTransition(async () => {
      const res = await changePassword({ currentPassword, password, confirm });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kata laluan berjaya ditukar." });
      setCurrentPassword("");
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
      <p className="text-sm text-slate-500">
        Masukkan kata laluan semasa anda untuk mengesahkan, kemudian tetapkan kata laluan baharu.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">
            Kata Laluan Semasa
          </label>
          <div className="relative max-w-sm">
            <input
              type={show ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            Kata Laluan Baharu
          </label>
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="input-base max-w-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">
            Sahkan Kata Laluan Baharu
          </label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="input-base max-w-sm"
          />
        </div>

        <button type="submit" disabled={isPending} className="btn-primary inline-flex items-center gap-2">
          {isPending ? <LoadingSpinner /> : <KeyRound size={16} />}
          Tukar Kata Laluan
        </button>
      </form>
    </section>
  );
}
