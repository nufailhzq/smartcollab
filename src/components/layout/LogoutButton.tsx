"use client";

import { LogOut } from "lucide-react";
import { LEFT_AT_KEY } from "./IdleLogout";

export function LogoutButton() {
  return (
    <form
      action="/logout"
      method="POST"
      onSubmit={() => {
        // Manual logout leaves a `pagehide` close-stamp behind; clear it so the
        // next login isn't misread by IdleLogout as "reopened after a close".
        try {
          localStorage.removeItem(LEFT_AT_KEY);
        } catch {
          /* ignore */
        }
      }}
    >
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
