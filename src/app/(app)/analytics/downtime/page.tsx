import { DowntimeDashboard } from "@/components/analytics/downtime-dashboard";
import { PageLayout } from "@/components/ui/page-layout";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DowntimeAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <PageLayout
      id="downtime-analytics-page"
      title="Downtime Analytics"
      subtitle="Equipment Availability"
      description="TRACK EQUIPMENT DOWNTIME, AVAILABILITY METRICS, AND IDENTIFY PROBLEMATIC ASSETS"
      bgSymbol="!"
    >
      <DowntimeDashboard />
    </PageLayout>
  );
}
