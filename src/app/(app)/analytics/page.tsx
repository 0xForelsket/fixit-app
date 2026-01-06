import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PageLayout } from "@/components/ui/page-layout";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <PageLayout
      id="analytics-page"
      title="Analytics Engine"
      subtitle="System Performance"
      description="REAL-TIME METRICS AND SYSTEM PERFORMANCE INSIGHTS"
      bgSymbol="AN"
    >
      <AnalyticsDashboard />
    </PageLayout>
  );
}
