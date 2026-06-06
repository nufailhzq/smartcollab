"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileCheck,
  Flag,
  Hash,
  Layers,
  LayoutDashboard,
  Megaphone,
  Menu,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; Icon: LucideIcon; exact?: boolean };

const STUDENT_TABS: Tab[] = [
  { href: "/student", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/student/kursus", label: "Kursus Saya", Icon: BookOpen },
  { href: "/student/kumpulan", label: "Kumpulan Saya", Icon: Users },
  { href: "/student/tugasan", label: "Tugasan", Icon: Upload },
  { href: "/folio", label: "Folio Connect", Icon: Hash },
  { href: "/student/kalendar", label: "Kalendar", Icon: Calendar },
];

const LECTURER_TABS: Tab[] = [
  { href: "/lecturer", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/lecturer/kursus", label: "Kursus Saya", Icon: BookOpen },
  { href: "/lecturer/pengurusan-kumpulan", label: "Urus Kumpulan", Icon: Users },
  { href: "/lecturer/penghantaran", label: "Penghantaran Pelajar", Icon: FileCheck },
  { href: "/lecturer/pemantauan", label: "Progress Monitoring", Icon: BarChart3 },
  { href: "/folio", label: "Folio Connect", Icon: Hash },
  { href: "/lecturer/kalendar", label: "Kalendar", Icon: Calendar },
];

const ADMIN_TABS: Tab[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/pengguna", label: "Pengguna", Icon: Users },
  { href: "/admin/kursus", label: "Kursus", Icon: BookOpen },
  { href: "/admin/pemberian", label: "Pemberian Kursus", Icon: FileCheck },
  { href: "/admin/buletin", label: "Buletin", Icon: Megaphone },
  { href: "/admin/laporan", label: "Laporan", Icon: Flag },
  { href: "/admin/sistem", label: "Sistem", Icon: Layers },
];

const TABS_BY_ROLE: Record<"STUDENT" | "LECTURER" | "ADMIN", Tab[]> = {
  STUDENT: STUDENT_TABS,
  LECTURER: LECTURER_TABS,
  ADMIN: ADMIN_TABS,
};

export type SidebarCourse = { id: number; code: string; title: string };

type Props = {
  role: "STUDENT" | "LECTURER" | "ADMIN";
  courses: SidebarCourse[];
};

export function LeftSidebar({ role, courses }: Props) {
  const pathname = usePathname();
  const tabs = TABS_BY_ROLE[role];
  const courseHrefBase = role === "STUDENT" ? "/student/kursus/" : "/lecturer/kursus/";

  const [mobileOpen, setMobileOpen] = useState(false);
  // Compact mode hides the dashboard nav tabs but keeps the course list
  // visible. Toggled by clicking the hamburger inside the desktop sidebar.
  const [compact, setCompact] = useState(false);

  // Restore compact preference from localStorage on first mount.
  useEffect(() => {
    try {
      setCompact(localStorage.getItem("ukmfolio-sidebar-compact") === "1");
    } catch {
      /* private mode */
    }
  }, []);

  function toggleCompact() {
    setCompact((v) => {
      const next = !v;
      try {
        localStorage.setItem("ukmfolio-sidebar-compact", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Close drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Listen for hamburger toggle event from Navbar
  useEffect(() => {
    const onToggle = () => setMobileOpen((v) => !v);
    window.addEventListener("ukmfolio:toggle-sidebar", onToggle);
    return () => window.removeEventListener("ukmfolio:toggle-sidebar", onToggle);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const isActive = (tab: Tab) => {
    if (tab.exact) return pathname === tab.href;
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  };

  const body = (
    <>
      {!compact && (
        <>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider sidebar-section">
            Papan Pemuka
          </p>
          <nav className="mb-6 space-y-1">
            {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all duration-200 ease-spring",
                active
                  ? "sidebar-link-active border-l-4 border-ukm-orange font-bold shadow-sm"
                  : "sidebar-link hover:translate-x-1",
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-transform duration-200",
                  active ? "scale-110" : "group-hover:scale-110",
                )}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
        </>
      )}

      {courses.length > 0 && (
        <>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider sidebar-section">
            Kursus Saya
          </p>
          <ul className="space-y-1">
            {courses.map((c) => {
              const href = `${courseHrefBase}${c.code}`;
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={c.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ease-spring",
                      active
                        ? "sidebar-link-active border-l-4 border-ukm-orange font-bold"
                        : "sidebar-link hover:translate-x-1",
                    )}
                  >
                    <BookOpen
                      size={15}
                      className={cn(
                        "mt-0.5 shrink-0",
                        active ? "text-ukm-orange" : "sidebar-icon-faint",
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate font-bold",
                          active ? "text-ukm-orange" : "sidebar-course-code",
                        )}
                      >
                        {c.code}
                      </p>
                      <p className="truncate text-xs sidebar-course-title">{c.title}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar — uses .glass so it follows the active theme */}
      <aside className="glass hidden w-72 shrink-0 border-r border-l-0 border-t-0 border-b-0 md:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <div className="mb-6 flex items-center justify-between sidebar-header">
            <button
              type="button"
              onClick={toggleCompact}
              aria-label={compact ? "Tunjuk navigasi" : "Sembunyikan navigasi"}
              title={compact ? "Tunjuk navigasi" : "Sembunyikan navigasi"}
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-[color-mix(in_oklab,var(--text)_8%,transparent)]"
            >
              <Menu size={18} />
              <span className="text-sm font-bold">
                {compact ? "Kursus" : "Navigasi"}
              </span>
            </button>
          </div>
          {body}
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Panel — glass surface to match theme */}
        <aside
          className={cn(
            "glass absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto p-4 shadow-2xl transition-transform duration-300 ease-spring",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between sidebar-header">
            <div className="flex items-center gap-2">
              <Menu size={18} />
              <span className="text-sm font-semibold">Navigasi</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="rounded-lg p-1.5 sidebar-icon hover:bg-[color-mix(in_oklab,var(--text)_8%,transparent)]"
            >
              <X size={18} />
            </button>
          </div>
          {body}
        </aside>
      </div>
    </>
  );
}
