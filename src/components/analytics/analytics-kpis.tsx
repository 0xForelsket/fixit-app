"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { AlertCircle, BarChart3, CheckCircle2, Clock } from "lucide-react";

interface KPIs {
  openTickets: number;
  highPriorityOpen: number;
  mttrHours: number;
  slaRate: number;
  period: string;
}

interface AnalyticsKPIsProps {
  data: KPIs | null;
}

export function AnalyticsKPIs({ data }: AnalyticsKPIsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="MTTR (30d)"
        value={`${data?.mttrHours || 0}h`}
        description="Mean Time To Repair"
        icon={Clock}
        color="text-secondary-600"
        bg="bg-secondary-50"
      />
      <StatsCard
        title="SLA Compliance"
        value={`${data?.slaRate || 0}%`}
        description="Resolved within deadline"
        icon={CheckCircle2}
        color="text-success-600"
        bg="bg-success-50"
      />
      <StatsCard
        title="Open Tickets"
        value={data?.openTickets || 0}
        description="Current system backlog"
        icon={BarChart3}
        color="text-primary-600"
        bg="bg-primary-50"
      />
      <StatsCard
        title="Critical Issues"
        value={data?.highPriorityOpen || 0}
        description="Open High/Critical"
        icon={AlertCircle}
        color="text-danger-600"
        bg="bg-danger-50"
        pulse={!!data?.highPriorityOpen}
      />
    </div>
  );
}
