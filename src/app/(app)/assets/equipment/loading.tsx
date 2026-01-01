import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStatsGrid, SkeletonTable } from "@/components/ui/skeleton";

export default function EquipmentLoading() {
  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        title="Equipment List"
        subtitle="Asset Registry"
        description="SCANNING ASSET REGISTRY..."
        bgSymbol="EQ"
      />

      <SkeletonStatsGrid />

      <div className="space-y-4">
        <div className="h-10 w-full max-w-md rounded-lg bg-zinc-100 animate-pulse" />
        <SkeletonTable rows={10} cols={5} />
      </div>
    </div>
  );
}
