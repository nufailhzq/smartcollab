import { Users } from "lucide-react";
import { getAdminUsers } from "@/server/queries/admin";
import { UserManager } from "./user-manager";
import type { Role } from "@prisma/client";

const ROLE_FILTERS = ["ALL", "STUDENT", "LECTURER", "ADMIN"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];
const ACTIVE_FILTERS = ["ALL", "ACTIVE", "INACTIVE"] as const;
type ActiveFilter = (typeof ACTIVE_FILTERS)[number];

function parseRole(value: string | undefined): RoleFilter {
  if (value && (ROLE_FILTERS as readonly string[]).includes(value)) return value as RoleFilter;
  return "ALL";
}
function parseActive(value: string | undefined): ActiveFilter {
  if (value && (ACTIVE_FILTERS as readonly string[]).includes(value)) return value as ActiveFilter;
  return "ALL";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; active?: string; q?: string };
}) {
  const role = parseRole(searchParams.role);
  const active = parseActive(searchParams.active);
  const search = (searchParams.q ?? "").slice(0, 80);

  const users = await getAdminUsers({
    role: role === "ALL" ? "ALL" : (role as Role),
    isActive: active,
    search,
  });

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <Users size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Pengurusan Pengguna</h1>
            <p className="mt-1 text-sm text-white/80">
              Cipta, kemaskini, dan urus akaun pelajar, pensyarah, dan pentadbir.
            </p>
          </div>
        </div>
      </div>

      <UserManager
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          matricNum: u.matricNum,
          faculty: u.faculty,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
          counts: u._count,
        }))}
        filters={{ role, active, search }}
      />
    </div>
  );
}
