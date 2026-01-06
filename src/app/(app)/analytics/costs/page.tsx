import { CostDashboard } from "@/components/analytics/cost-dashboard";
import { PageLayout } from "@/components/ui/page-layout";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CostAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <PageLayout
      id="cost-analytics-page"
      title="Cost Analytics"
      subtitle="Financial Tracking"
      description="LABOR AND PARTS COST ANALYSIS ACROSS WORK ORDERS, EQUIPMENT, AND DEPARTMENTS"
      bgSymbol="$"
    >
      <CostDashboard />
    </PageLayout>
  );
}
