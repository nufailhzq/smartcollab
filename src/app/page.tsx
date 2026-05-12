import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/permissions";

export default async function RootPage() {
  const session = await auth();

  // 1. If no session, go to login
  if (!session) {
    redirect("/login");
  }

  // 2. Safely get the role. If it's missing, don't crash, just go to login.
  const userRole = session?.user?.role;

  if (!userRole) {
    redirect("/login");
  }

  // 3. Success! Redirect to the dashboard
  redirect(dashboardPathFor(userRole));
}