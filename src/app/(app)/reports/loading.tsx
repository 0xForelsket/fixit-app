import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonStatsGrid, SkeletonTable } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <PageLayout
      id="reports-page"
      title="System Reports"
      subtitle="Performance Analytics"
      description="GENERATING OPERATIONAL SUMMARY..."
      bgSymbol="RE"
      stats={<SkeletonStatsGrid />}
      filters={
        <div className="flex flex-col sm:flex-row gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-32 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      }
    >
      <SkeletonTable rows={10} cols={6} />
    </PageLayout>
  );
}
