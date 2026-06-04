import { RoleGuard } from "@/components/layout/RoleGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Shared layout for the cross-role Folio Connect routes. Students and
 * lecturers both share the same feed — the Sidebar component already picks
 * the correct nav tabs and course list based on session.role.
 */
export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["STUDENT", "LECTURER"]}>
      <div className="relative min-h-screen overflow-hidden aurora-bg">
        <div className="pointer-events-none absolute left-1/3 -top-32 -z-10 h-[28rem] w-[28rem] animate-bg-drift rounded-full bg-cyan-300/15 blur-3xl" />
        <div
          className="pointer-events-none absolute right-1/4 -bottom-32 -z-10 h-[32rem] w-[32rem] animate-bg-drift rounded-full bg-orange-300/12 blur-3xl"
          style={{ animationDelay: "5s" }}
        />
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="page-enter min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 md:px-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
