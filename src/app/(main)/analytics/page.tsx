import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          Analytics <span className="text-primary-600 uppercase">Engine</span>
        </h1>
        <p className="text-zinc-500 font-medium">
          Real-time metrics and system performance insights
        </p>
      </div>
      <div className="relative">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
