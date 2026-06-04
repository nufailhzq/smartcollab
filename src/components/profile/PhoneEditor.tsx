"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Save } from "lucide-react";
import { updateContact } from "@/server/actions/profile";

type Props = {
  initialPhone: string | null;
};

/**
 * Inline phone editor used on the profile page. Saves via the
 * `updateContact` server action; null/empty input clears the stored value.
 */
export function PhoneEditor({ initialPhone }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const res = await updateContact({ phone });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const dirty = (phone.trim() || null) !== (initialPhone || null);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <Phone className="mt-0.5 shrink-0 text-ukm-teal" size={16} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Telefon</p>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="cth. 012-345 6789"
            maxLength={32}
            className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-ukm-navy outline-none focus:border-ukm-teal focus:ring-2 focus:ring-sky-500/15"
          />
          <button
            type="button"
            onClick={onSave}
            disabled={pending || !dirty}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-ukm-teal px-2 py-1 text-xs font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-40"
          >
            {pending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Simpan
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] text-ukm-red">{error}</p>}
        {saved && !error && (
          <p className="mt-1 text-[11px] text-emerald-600">Disimpan.</p>
        )}
      </div>
    </div>
  );
}
