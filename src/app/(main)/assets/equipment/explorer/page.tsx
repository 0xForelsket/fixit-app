import { db } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssetTree } from "./asset-tree";

export default async function EquipmentExplorerPage() {
  const allEquipment = await db.query.equipment.findMany({
    with: {
      location: true,
    },
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
  });

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl border border-zinc-200 bg-white shadow-sm transition-all active:scale-95">
          <Link href="/assets/equipment">
            <ArrowLeft className="h-4 w-4 text-zinc-600" />
          </Link>
        </Button>
        <PageHeader
          title="Asset"
          highlight="Explorer"
          description="A HIERARCHICAL VIEW OF YOUR INDUSTRIAL INFRASTRUCTURE"
          icon={Layers}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/50 backdrop-blur-sm shadow-xl shadow-zinc-200/20 overflow-hidden">
        <AssetTree initialEquipment={allEquipment} />
      </div>
    </div>
  );
}
