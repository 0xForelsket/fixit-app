import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStatsGrid } from "@/components/ui/skeleton";
import { MonitorCog, User, Users } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        title="Technician"
        highlight="Terminal"
        description="SYNCING OPERATIONAL DATA..."
        icon={MonitorCog}
      />

      {/* Personal Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-zinc-300" />
          <div className="h-6 w-48 rounded bg-zinc-100 animate-pulse" />
        </div>
        <SkeletonStatsGrid />
      </div>

      {/* Queue Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 bg-zinc-200 rounded-full" />
            <div className="h-8 w-32 rounded bg-zinc-100 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200" />
          ))}
        </div>
      </div>

      {/* Global Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-zinc-300" />
          <div className="h-6 w-32 rounded bg-zinc-100 animate-pulse" />
        </div>
        <SkeletonStatsGrid />
      </div>
    </div>
  );
}
