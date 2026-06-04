"use client";

import { Menu } from "lucide-react";

export function MobileNavToggle() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("ukmfolio:toggle-sidebar"))
      }
      aria-label="Buka menu"
      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy md:hidden"
    >
      <Menu size={20} />
    </button>
  );
}
