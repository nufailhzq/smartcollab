import { RoleGuard } from "@/components/layout/RoleGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

// Admin pages all hit the database from the server. Marking the segment
// dynamic stops `next build` from trying to prerender them — which fails
// inside the Docker builder because the build container has no DB access.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["ADMIN"]}>
      <div className="relative min-h-screen overflow-hidden aurora-bg">
        <div className="pointer-events-none absolute left-1/4 -top-32 -z-10 h-[28rem] w-[28rem] animate-bg-drift rounded-full bg-pink-300/12 blur-3xl" />
        <div
          className="pointer-events-none absolute -right-40 bottom-10 -z-10 h-[32rem] w-[32rem] animate-bg-drift rounded-full bg-slate-400/12 blur-3xl"
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
