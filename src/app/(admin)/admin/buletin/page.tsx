import { Megaphone } from "lucide-react";
import { getAllBulletins } from "@/server/queries/bulletins";
import { BulletinManager } from "./bulletin-manager";

export default async function AdminBulletinPage() {
  const bulletins = await getAllBulletins();

  return (
    <div className="space-y-6">
      <div className="gradient-hero-navy relative overflow-hidden rounded-2xl px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <Megaphone size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Buletin</h1>
            <p className="mt-1 text-sm text-white/80">
              Cipta pengumuman yang dipaparkan di papan pemuka pelajar dan pensyarah.
            </p>
          </div>
        </div>
      </div>

      <BulletinManager
        bulletins={bulletins.map((b) => ({
          id: b.id,
          title: b.title,
          body: b.body,
          imagePath: b.imagePath,
          linkUrl: b.linkUrl,
          linkLabel: b.linkLabel,
          isActive: b.isActive,
          isPinned: b.isPinned,
          createdById: b.createdById,
          createdByName: b.createdBy.name,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
