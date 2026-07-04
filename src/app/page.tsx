import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/permissions";

export default async function RootPage() {
  const session = await auth();

  // 1. No session → show the public landing page (which links to /login).
  if (!session) {
    redirect("/welcome");
  }

  // 2. Safely get the role. If it's missing, fall back to the landing page.
  const userRole = session?.user?.role;

  if (!userRole) {
    redirect("/welcome");
  }

  // 3. Success! Redirect to the dashboard
  redirect(dashboardPathFor(userRole));
}