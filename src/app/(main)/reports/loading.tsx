import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStatsGrid, SkeletonTable } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

export default function ReportsLoading() {
  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        title="Reports"
        highlight="Analytics"
        description="GENERATING OPERATIONAL SUMMARY..."
        icon={FileText}
      />

      <SkeletonStatsGrid />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
           {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-10 w-32 rounded-lg bg-zinc-100 animate-pulse" />
           ))}
        </div>
        <SkeletonTable rows={10} cols={6} />
      </div>
    </div>
  );
}
