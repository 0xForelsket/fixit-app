"use client";

import { AnalyticsKPIs } from "@/components/analytics/analytics-kpis";
import { EquipmentHealthTable } from "@/components/analytics/equipment-health-table";
import { TechnicianChart } from "@/components/analytics/technician-chart";
import { ThroughputChart } from "@/components/analytics/throughput-chart";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useEffect, useState } from "react";

interface KPIs {
  openTickets: number;
  highPriorityOpen: number;
  mttrHours: number;
  slaRate: number;
  period: string;
}

interface TrendPoint {
  day: string;
  created_count: number;
  resolved_count: number;
}

interface TechStat {
  id: number;
  name: string;
  resolvedCount: number;
  activeCount: number;
}

interface EquipmentStat {
  id: number;
  name: string;
  code: string;
  breakdowns: number;
  downtimeHours: number;
  totalTickets: number;
}

export function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [techStats, setTechStats] = useState<TechStat[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, trendRes, techRes, equipmentRes] = await Promise.all([
          fetch("/api/analytics/kpis"),
          fetch("/api/analytics/trends"),
          fetch("/api/analytics/technicians"),
          fetch("/api/analytics/equipment"),
        ]);

        if (kpiRes.ok) setKpis(await kpiRes.json());
        if (trendRes.ok) setTrends(await trendRes.json());
        if (techRes.ok) setTechStats(await techRes.json());
        if (equipmentRes.ok) setEquipmentStats(await equipmentRes.json());
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="h-10 w-10 border-4 border-zinc-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-mono text-xs font-bold uppercase tracking-widest">
          Initialising Analytics Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ErrorBoundary fallback={<div>Failed to load KPIs</div>}>
        <AnalyticsKPIs data={kpis} />
      </ErrorBoundary>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <ErrorBoundary fallback={<div>Failed to load Throughput Chart</div>}>
          <ThroughputChart data={trends} />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div>Failed to load Technician Stats</div>}>
          <TechnicianChart data={techStats} />
        </ErrorBoundary>
      </div>

      <ErrorBoundary fallback={<div>Failed to load Equipment Health</div>}>
        <EquipmentHealthTable data={equipmentStats} />
      </ErrorBoundary>
    </div>
  );
}
