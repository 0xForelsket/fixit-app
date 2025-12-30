import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Analytics Engine"
        subtitle="System Performance"
        description="Real-time metrics and system performance insights"
        bgSymbol="AN"
      />
      <div className="relative">
        <AnalyticsDashboard />
      </div>
    </PageContainer>
  );
}
