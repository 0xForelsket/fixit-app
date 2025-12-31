import { CostDashboard } from "@/components/analytics/cost-dashboard";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CostAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Cost Analytics"
        subtitle="Financial Tracking"
        description="Labor and parts cost analysis across work orders, equipment, and departments"
        bgSymbol="$"
      />
      <div className="relative">
        <CostDashboard />
      </div>
    </PageContainer>
  );
}
