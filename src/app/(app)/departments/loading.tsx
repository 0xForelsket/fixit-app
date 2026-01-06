import { PageLayout } from "@/components/ui/page-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentsLoading() {
  return (
    <PageLayout
      id="departments-page"
      title="Departments"
      subtitle="Organization"
      description="LOADING DEPARTMENTS..."
      bgSymbol="DP"
      stats={
        <div className="flex gap-4 overflow-x-auto py-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex min-w-[140px] items-center gap-3 rounded-xl border bg-card p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      }
    >
      {/* Departments Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-6 animate-pulse"
          >
            {/* Code badge skeleton */}
            <div className="flex justify-end mb-4">
              <Skeleton className="h-6 w-12 rounded-lg" />
            </div>

            {/* Icon and name */}
            <div className="flex items-start gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>

            {/* Manager info */}
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 mb-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="text-center space-y-2">
                  <Skeleton className="h-4 w-4 mx-auto" />
                  <Skeleton className="h-5 w-8 mx-auto" />
                  <Skeleton className="h-2 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
