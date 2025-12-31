import { DowntimeDashboard } from "@/components/analytics/downtime-dashboard";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DowntimeAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Downtime Analytics"
        subtitle="Equipment Availability"
        description="Track equipment downtime, availability metrics, and identify problematic assets"
        bgSymbol="!"
      />
      <div className="relative">
        <DowntimeDashboard />
      </div>
    </PageContainer>
  );
}
