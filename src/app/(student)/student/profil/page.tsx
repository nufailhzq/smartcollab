import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AvatarUploader } from "@/components/common/AvatarUploader";
import {
  Building2,
  Calendar,
  GraduationCap,
  Hash,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default async function StudentProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, enrollmentsCount, groupCount, submissionsCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.classEnrollment.count({ where: { studentId: userId } }),
    prisma.groupMember.count({ where: { studentId: userId } }),
    prisma.submission.count({ where: { studentId: userId } }),
  ]);

  const fields = [
    { label: "Nama", value: user.name, Icon: GraduationCap },
    { label: "No. Matrik", value: user.matricNum ?? "—", Icon: Hash },
    { label: "Emel", value: user.email ?? "—", Icon: Mail },
    { label: "Fakulti", value: user.faculty ?? "—", Icon: Building2 },
    { label: "Peranan", value: "Pelajar", Icon: ShieldCheck },
    { label: "Daftar", value: formatDate(user.createdAt), Icon: Calendar },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ukm-navy">Profil Saya</h1>
        <p className="text-sm text-slate-500">Maklumat akaun anda di UKMFolio.</p>
      </div>

      <article className="card-elevated">
        <AvatarUploader
          name={user.name}
          initialAvatarPath={user.avatarPath}
          badge={
            <div>
              <h2 className="text-xl font-bold text-ukm-navy">{user.name}</h2>
              <p className="text-sm text-slate-500">
                <span className="badge-student mr-2">Pelajar</span>
                {user.matricNum} · {user.faculty}
              </p>
            </div>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <Icon className="mt-0.5 text-ukm-teal" size={16} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-ukm-navy">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-ukm-teal">{enrollmentsCount}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Kursus</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{groupCount}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Kumpulan</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-ukm-orange">{submissionsCount}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">Penghantaran</p>
        </div>
      </div>

      <form action="/logout" method="POST">
        <button type="submit" className="btn-danger">
          <LogOut size={16} /> Log Keluar
        </button>
      </form>
    </div>
  );
}
