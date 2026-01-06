import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonStatsGrid, SkeletonTable } from "@/components/ui/skeleton";

export default function EquipmentLoading() {
  return (
    <PageLayout
      id="equipment-page"
      title="Equipment List"
      subtitle="Infrastructure Monitoring"
      description="SCANNING ASSET REGISTRY..."
      bgSymbol="EQ"
      stats={<SkeletonStatsGrid />}
    >
      <div className="space-y-4">
        <div className="h-10 w-full max-w-md rounded-lg bg-muted animate-pulse" />
        <SkeletonTable rows={10} cols={5} />
      </div>
    </PageLayout>
  );
}
