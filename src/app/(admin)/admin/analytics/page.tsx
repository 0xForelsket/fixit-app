import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Real-time metrics and performance insights.
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
