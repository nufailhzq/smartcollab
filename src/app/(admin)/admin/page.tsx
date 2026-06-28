import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Layers,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

type QuickLink = { href: string; label: string; description: string; Icon: LucideIcon };

const QUICK_LINKS: QuickLink[] = [
  {
    href: "/admin/pengguna",
    label: "Pengguna",
    description: "Cipta, kemaskini, dan reset kata laluan pengguna.",
    Icon: Users,
  },
  {
    href: "/admin/kursus",
    label: "Kursus",
    description: "Urus katalog kursus dan tetapkan pensyarah.",
    Icon: BookOpen,
  },
  {
    href: "/admin/sistem",
    label: "Sistem",
    description: "Statistik pangkalan data dan operasi seed.",
    Icon: Layers,
  },
];

export default async function AdminDashboard() {
  const [users, courses, assignments, messages] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.assignment.count(),
    prisma.message.count(),
  ]);

  const stats = [
    { label: "Pengguna", value: users, Icon: Users, accent: "text-ukm-teal" },
    { label: "Kursus", value: courses, Icon: BookOpen, accent: "text-ukm-teal" },
    { label: "Tugasan", value: assignments, Icon: ClipboardList, accent: "text-ukm-orange" },
    { label: "Mesej", value: messages, Icon: MessageSquare, accent: "text-pink-400" },
  ];

  return (
    <div className="space-y-6">
      <OnboardingGate />
      <div>
        <h1 className="text-2xl font-bold">Pentadbiran Sistem</h1>
        <p className="text-sm text-slate-500">Statistik keseluruhan UKMFolio</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, accent }, i) => (
          <div
            key={label}
            className="card card-hover flex items-center gap-4 animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50">
              <Icon className={accent} size={22} />
            </div>
            <div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_LINKS.map(({ href, label, description, Icon }, i) => (
          <Link
            key={href}
            href={href}
            className="card card-hover group animate-slide-up hover:border-ukm-orange"
            style={{ animationDelay: `${(i + 4) * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-ukm-orange transition-all duration-300 ease-spring group-hover:scale-110 group-hover:bg-ukm-orange group-hover:text-white">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-base font-semibold text-ukm-navy">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
