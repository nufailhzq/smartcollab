import { Layers } from "lucide-react";
import { getSystemStats } from "@/server/queries/admin";
import { SystemPanel } from "./system-panel";

export default async function AdminSystemPage() {
  const stats = await getSystemStats();
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <Layers size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Sistem</h1>
            <p className="mt-1 text-sm text-white/80">
              Pemantauan keadaan pangkalan data dan operasi pentadbiran.
            </p>
          </div>
        </div>
      </div>

      <SystemPanel stats={stats} isProduction={isProduction} />
    </div>
  );
}
