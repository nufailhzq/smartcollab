"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action="/logout" method="POST">
      <button
        type="submit"
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ukm-red"
        aria-label="Log keluar"
        title="Log keluar"
      >
        <LogOut size={18} />
      </button>
    </form>
  );
}
