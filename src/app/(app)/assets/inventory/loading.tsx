import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard, SkeletonStatsGrid } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        title="Inventory"
        subtitle="Control"
        description="SYNCING WAREHOUSE DATA..."
        bgSymbol="IV"
      />

      <SkeletonStatsGrid />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200"
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-zinc-100 animate-pulse" />
            <div className="h-3 w-32 rounded bg-zinc-100 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
