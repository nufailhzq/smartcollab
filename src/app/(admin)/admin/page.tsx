import { prisma } from "@/lib/prisma";
import { Users, BookOpen, ClipboardList, MessageSquare } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-bold">Pentadbiran Sistem</h1>
        <p className="text-sm text-slate-500">Statistik keseluruhan UKMFolio</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, accent }) => (
          <div key={label} className="card flex items-center gap-4">
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
      <div className="card">
        <h2 className="mb-2 text-lg font-semibold">Slice seterusnya</h2>
        <p className="text-sm text-slate-500">
          Pengurusan pengguna (CRUD), pengurusan kursus, dan halaman sistem (re-run seed) akan
          datang.
        </p>
      </div>
    </div>
  );
}
