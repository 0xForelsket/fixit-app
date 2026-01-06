import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function SchedulesLoading() {
  return (
    <PageLayout
      id="schedules-page"
      title="Maintenance Schedules"
      subtitle="Operations Registry"
      description="LOADING SCHEDULES..."
      bgSymbol="PM"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <SkeletonTable rows={8} cols={5} />
      </div>
    </PageLayout>
  );
}
