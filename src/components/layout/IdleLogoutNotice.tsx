"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

/**
 * Shown on the login page after an idle-timeout logout (redirect carries
 * ?reason=idle). Bilingual: Malay on top, English below. The query param is
 * stripped from the URL once shown so a refresh doesn't re-trigger it.
 */
export function IdleLogoutNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") !== "idle") return;
    setShow(true);
    params.delete("reason");
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, []);

  if (!show) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-soft animate-fade-in">
      <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="flex-1 text-sm leading-snug">
        <p className="font-bold">
          Tidak aktif selama 10 minit. Atas sebab keselamatan, anda telah log keluar.
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Inactive for 10 minutes. For safety reasons you have been logged off.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Tutup"
        className="shrink-0 rounded-md p-1 text-amber-600 transition hover:bg-amber-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
