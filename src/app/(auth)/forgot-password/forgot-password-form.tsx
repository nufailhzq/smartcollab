"use client";

import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/server/actions/password-reset";

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestPasswordReset({ identifier });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        <MailCheck className="mb-2 text-emerald-600" size={22} />
        <p className="font-semibold">Semak e-mel anda</p>
        <p className="mt-1 text-emerald-700">
          Jika akaun wujud dan mempunyai e-mel, pautan tetapan semula telah dihantar. Pautan sah
          selama 30 minit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="identifier"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ukm-navy"
        >
          No. Matrik atau E-mel
        </label>
        <input
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoFocus
          placeholder="A123456 atau nama@siswa.ukm.edu.my"
          className="input-base"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-gradient-to-r from-ukm-teal via-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Menghantar…" : "Hantar Pautan Tetapan Semula"}
      </button>
    </form>
  );
}
