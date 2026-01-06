import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonCard, SkeletonStatsGrid } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <PageLayout
      id="inventory-page"
      title="Inventory Control"
      subtitle="Stock Management"
      description="SYNCING WAREHOUSE DATA..."
      bgSymbol="IV"
      stats={<SkeletonStatsGrid />}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-card animate-pulse border border-border" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-card animate-pulse border border-border"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
