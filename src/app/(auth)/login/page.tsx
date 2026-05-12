import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/permissions";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  // The ?. ensures that if role is missing, it doesn't crash the whole page
  if (session?.user?.role) {
    redirect(dashboardPathFor(session.user.role));
  }

  return <LoginForm />;
}