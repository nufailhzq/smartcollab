import Link from "next/link";
import { Link2 } from "lucide-react";

/**
 * Folio Connect entry point in the topbar (beside the search bar). Replaces the
 * old sidebar nav item. Navigates to /folio, with a styled hover tooltip on top
 * of the native title for accessibility.
 */
export function FolioConnectButton() {
  return (
    <div className="group relative">
      <Link
        href="/folio"
        aria-label="Folio Connect"
        title="Folio Connect"
        className="flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ukm-navy"
      >
        <Link2 size={18} />
      </Link>
      {/* Styled hover tooltip — hidden by default, shown on group hover. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ukm-navy px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        Folio Connect
      </span>
    </div>
  );
}
