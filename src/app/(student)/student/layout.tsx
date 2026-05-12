import { RoleGuard } from "@/components/layout/RoleGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["STUDENT"]}>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 px-6 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
