"use client";

import { useState, useTransition } from "react";
import { KeyRound, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { changePassword } from "@/server/actions/password-reset";

// ─────────────────────────────────────────────────────────────────────────────
// Profile "Tukar Kata Laluan": collapsed to a button by default. Clicking opens
// the form (current → new → confirm). Submitting asks for a final confirmation
// (reconfirm) before the change is actually applied.
// ─────────────────────────────────────────────────────────────────────────────

export function ChangePasswordCard() {
  const toast = useToast();
  const [openForm, setOpenForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    setShow(false);
  }

  // Validate then open the reconfirm dialog (doesn't change anything yet).
  function requestChange(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !password || !confirm) {
      toast.push({ kind: "error", message: "Sila lengkapkan semua medan." });
      return;
    }
    if (password.length < 6) {
      toast.push({ kind: "error", message: "Kata laluan baharu sekurang-kurangnya 6 aksara." });
      return;
    }
    if (password !== confirm) {
      toast.push({ kind: "error", message: "Kata laluan baharu tidak sepadan." });
      return;
    }
    setConfirmOpen(true);
  }

  // Actually apply the change after the user reconfirms.
  function applyChange() {
    startTransition(async () => {
      const res = await changePassword({ currentPassword, password, confirm });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        setConfirmOpen(false);
        return;
      }
      toast.push({ kind: "success", message: "Kata laluan berjaya ditukar." });
      setConfirmOpen(false);
      setOpenForm(false);
      reset();
    });
  }

  return (
    <section className="card space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        <KeyRound className="text-ukm-teal" size={18} />
        <h2 className="text-base font-semibold text-ukm-navy">Kata Laluan</h2>
        {!openForm && (
          <button
            type="button"
            onClick={() => setOpenForm(true)}
            className="btn-primary ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <KeyRound size={15} /> Tukar Kata Laluan
          </button>
        )}
      </header>

      {!openForm ? (
        <p className="text-sm text-slate-500">
          Tukar kata laluan akaun anda. Anda perlu memasukkan kata laluan semasa untuk pengesahan.
        </p>
      ) : (
        <form onSubmit={requestChange} className="space-y-3">
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

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary inline-flex items-center gap-2">
              <KeyRound size={16} /> Tukar Kata Laluan
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenForm(false);
                reset();
              }}
              className="btn-secondary"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Reconfirm dialog before the change is actually applied. */}
      <Modal
        open={confirmOpen}
        onClose={() => (isPending ? null : setConfirmOpen(false))}
        title="Sahkan Tukar Kata Laluan"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 shrink-0 text-ukm-orange" size={22} />
          <p className="text-sm text-slate-700">
            Anda pasti mahu menukar kata laluan anda? Anda perlu log masuk semula dengan kata
            laluan baharu pada sesi akan datang.
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            disabled={isPending}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={applyChange}
            disabled={isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isPending ? <LoadingSpinner /> : <KeyRound size={15} />}
            Ya, Tukar
          </button>
        </div>
      </Modal>
    </section>
  );
}
