import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/permissions";
import { WelcomeLanding } from "./welcome-landing";

// Public landing page (pre-login). Logged-in users are bounced to their
// dashboard; everyone else sees the branded hero with a LOG IN entry point.
export default async function WelcomePage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(dashboardPathFor(session.user.role));
  }
  return <WelcomeLanding />;
}
