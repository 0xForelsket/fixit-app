import { PageLayout } from "@/components/ui/page-layout";

export default function DashboardLoading() {
  return (
    <PageLayout
      title="Technician Terminal"
      subtitle="Infrastructure Control"
      description="INITIALIZING SYSTEM MODULES..."
      bgSymbol="TT"
      headerActions={
        <div className="flex items-center gap-2 opacity-50 pointer-events-none">
          <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
        </div>
      }
      stats={
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="grid gap-1 grid-cols-1 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr bg-border rounded-xl overflow-hidden opacity-50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-card/50" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="grid gap-1 grid-cols-1 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr bg-border rounded-xl overflow-hidden opacity-50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-card/50" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-7 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-card animate-pulse rounded-lg border border-border"
              />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
