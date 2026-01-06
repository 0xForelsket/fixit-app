import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function RolesLoading() {
  return (
    <PageLayout
      id="roles-page"
      title="Role Management"
      subtitle="Access Control"
      description="LOADING ROLES..."
      bgSymbol="RO"
      stats={
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 opacity-50">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-card animate-pulse rounded-xl border border-border"
            />
          ))}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <SkeletonTable rows={5} cols={4} />
      </div>
    </PageLayout>
  );
}
