import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Props = {
  allowed: Role[];
  children: React.ReactNode;
};

export async function RoleGuard({ allowed, children }: Props) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!allowed.includes(session.user.role)) {
    redirect(dashboardPathFor(session.user.role));
  }
  return <>{children}</>;
}
