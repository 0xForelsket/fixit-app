import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStatsGrid, SkeletonTable } from "@/components/ui/skeleton";
import { MonitorCog } from "lucide-react";

export default function EquipmentLoading() {
  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        title="Equipment"
        highlight="List"
        description="SCANNING ASSET REGISTRY..."
        icon={MonitorCog}
      />

      <SkeletonStatsGrid />

      <div className="space-y-4">
        <div className="h-10 w-full max-w-md rounded-lg bg-zinc-100 animate-pulse" />
        <SkeletonTable rows={10} cols={5} />
      </div>
    </div>
  );
}
