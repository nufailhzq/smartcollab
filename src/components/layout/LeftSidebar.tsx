"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileCheck,
  Hash,
  Layers,
  LayoutDashboard,
  Megaphone,
  Menu,
  Upload,
  User,
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
  { href: "/student/profil", label: "Profil", Icon: User },
];

const LECTURER_TABS: Tab[] = [
  { href: "/lecturer", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/lecturer/kursus", label: "Kursus Saya", Icon: BookOpen },
  { href: "/lecturer/pengurusan-kumpulan", label: "Urus Kumpulan", Icon: Users },
  { href: "/lecturer/penghantaran", label: "Penghantaran Pelajar", Icon: FileCheck },
  { href: "/lecturer/pemantauan", label: "Progress Monitoring", Icon: BarChart3 },
  { href: "/folio", label: "Folio Connect", Icon: Hash },
  { href: "/lecturer/kalendar", label: "Kalendar", Icon: Calendar },
  { href: "/lecturer/profil", label: "Profil", Icon: User },
];

const ADMIN_TABS: Tab[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/pengguna", label: "Pengguna", Icon: Users },
  { href: "/admin/kursus", label: "Kursus", Icon: BookOpen },
  { href: "/admin/buletin", label: "Buletin", Icon: Megaphone },
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
      <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                  ? "border-l-4 border-ukm-orange bg-gradient-to-r from-orange-50 via-orange-50/60 to-transparent font-bold text-ukm-orange shadow-sm"
                  : "text-slate-600 hover:translate-x-1 hover:bg-slate-100 hover:text-ukm-navy",
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

      {courses.length > 0 && (
        <>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                        ? "border-l-4 border-ukm-orange bg-gradient-to-r from-orange-50 via-orange-50/60 to-transparent font-bold text-ukm-orange"
                        : "text-slate-600 hover:translate-x-1 hover:bg-slate-100",
                    )}
                  >
                    <BookOpen
                      size={15}
                      className={cn(
                        "mt-0.5 shrink-0",
                        active ? "text-ukm-orange" : "text-slate-400",
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate font-bold",
                          active ? "text-ukm-orange" : "text-ukm-navy",
                        )}
                      >
                        {c.code}
                      </p>
                      <p className="truncate text-xs text-slate-500">{c.title}</p>
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
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur-sm md:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <div className="mb-6 flex items-center gap-2 text-ukm-navy">
            <Menu size={18} />
            <span className="text-sm font-bold">Navigasi</span>
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
        {/* Panel */}
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-white p-4 shadow-2xl transition-transform duration-300 ease-spring",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between text-ukm-navy">
            <div className="flex items-center gap-2">
              <Menu size={18} />
              <span className="text-sm font-semibold">Navigasi</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
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
