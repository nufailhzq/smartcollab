"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileCheck,
  Layers,
  LayoutDashboard,
  Menu,
  Upload,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; Icon: LucideIcon; exact?: boolean };

const STUDENT_TABS: Tab[] = [
  { href: "/student", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/student/kursus", label: "Kursus Saya", Icon: BookOpen },
  { href: "/student/kumpulan", label: "Kumpulan Saya", Icon: Users },
  { href: "/student/tugasan", label: "Tugasan", Icon: Upload },
  { href: "/student/kalendar", label: "Kalendar", Icon: Calendar },
  { href: "/student/profil", label: "Profil", Icon: User },
];

const LECTURER_TABS: Tab[] = [
  { href: "/lecturer", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/lecturer/kursus", label: "Kursus Saya", Icon: BookOpen },
  { href: "/lecturer/pengurusan-kumpulan", label: "Urus Kumpulan", Icon: Users },
  { href: "/lecturer/penghantaran", label: "Penghantaran Pelajar", Icon: FileCheck },
  { href: "/lecturer/pemantauan", label: "Progress Monitoring", Icon: BarChart3 },
  { href: "/lecturer/kalendar", label: "Kalendar", Icon: Calendar },
  { href: "/lecturer/profil", label: "Profil", Icon: User },
];

const ADMIN_TABS: Tab[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/pengguna", label: "Pengguna", Icon: Users },
  { href: "/admin/kursus", label: "Kursus", Icon: BookOpen },
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

  const isActive = (tab: Tab) => {
    if (tab.exact) return pathname === tab.href;
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white shadow-sm md:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        <div className="mb-6 flex items-center gap-2 text-ukm-navy">
          <Menu size={18} />
          <span className="text-sm font-semibold">Navigasi</span>
        </div>

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Papan Pemuka
        </p>
        <nav className="mb-6 space-y-0.5">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.Icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  active
                    ? "border-l-4 border-ukm-orange bg-orange-50 font-semibold text-ukm-orange"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {courses.length > 0 && (
          <>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Kursus Saya
            </p>
            <ul className="space-y-0.5">
              {courses.map((c) => {
                const href = `${courseHrefBase}${c.code}`;
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition-all",
                        active
                          ? "border-l-4 border-ukm-orange bg-orange-50 font-semibold text-ukm-orange"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      <BookOpen
                        size={14}
                        className={cn(
                          "mt-0.5 shrink-0",
                          active ? "text-ukm-orange" : "text-slate-400",
                        )}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate font-semibold",
                            active ? "text-ukm-orange" : "text-ukm-navy",
                          )}
                        >
                          {c.code}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">{c.title}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
