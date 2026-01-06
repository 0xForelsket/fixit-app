import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonStatsGrid } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <PageLayout
      id="analytics-page"
      title="Analytics Engine"
      subtitle="System Performance"
      description="INITIALIZING ANALYTICS..."
      bgSymbol="AN"
    >
      <div className="space-y-8">
        <SkeletonStatsGrid />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[400px] bg-card animate-pulse rounded-xl border border-border" />
          <div className="h-[400px] bg-card animate-pulse rounded-xl border border-border" />
        </div>

        <div className="h-[300px] bg-card animate-pulse rounded-xl border border-border" />
      </div>
    </PageLayout>
  );
}
