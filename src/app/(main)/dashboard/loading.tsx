import { PageHeader } from "@/components/ui/page-header";
import { Loader2, MonitorCog } from "lucide-react";

/**
 * Dashboard Loading State
 *
 * This loading.tsx file enables Next.js streaming:
 * - Shows immediately while the page data is being fetched
 * - Improves perceived performance by showing layout structure
 * - Used as a fallback during initial page load
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-10 pb-8 min-h-full">
      {/* Page Header */}
      <PageHeader
        title="Technician"
        highlight="Terminal"
        description="Control panel for maintenance operations"
        icon={MonitorCog}
        className="pb-4"
      />

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-zinc-500 font-medium">
            Loading dashboard data...
          </p>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-zinc-200 animate-pulse rounded" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-zinc-100 animate-pulse rounded-lg border border-zinc-200"
            />
          ))}
        </div>
      </div>

      {/* Feed skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-zinc-200 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-zinc-100 animate-pulse rounded-lg border border-zinc-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
