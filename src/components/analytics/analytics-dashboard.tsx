"use client";

import { AnalyticsKPIs } from "@/components/analytics/analytics-kpis";
import { EquipmentHealthTable } from "@/components/analytics/equipment-health-table";
import { PredictiveMaintenanceWidget } from "@/components/analytics/predictive-maintenance-widget";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { TechnicianSelect } from "@/components/ui/technician-select";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const ThroughputChart = dynamic(
  () =>
    import("@/components/analytics/throughput-chart").then(
      (mod) => mod.ThroughputChart
    ),
  {
    loading: () => (
      <div className="h-[400px] w-full bg-zinc-50 animate-pulse rounded-xl border border-zinc-100 flex items-center justify-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Loading Chart Engine...
        </p>
      </div>
    ),
    ssr: false,
  }
);

const TechnicianChart = dynamic(
  () =>
    import("@/components/analytics/technician-chart").then(
      (mod) => mod.TechnicianChart
    ),
  {
    loading: () => (
      <div className="h-[400px] w-full bg-zinc-50 animate-pulse rounded-xl border border-zinc-100 flex items-center justify-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Syncing Technician Data...
        </p>
      </div>
    ),
    ssr: false,
  }
);

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

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function AnalyticsDashboard() {
  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  });
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<
    string | null
  >(null);

  // Data state
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [techStats, setTechStats] = useState<TechStat[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
      if (selectedTechnicianId) {
        params.set("technicianId", selectedTechnicianId);
      }

      const queryString = params.toString();

      const [kpiRes, trendRes, techRes, equipmentRes] = await Promise.all([
        fetch(`/api/analytics/kpis?${queryString}`),
        fetch(`/api/analytics/trends?${queryString}`),
        fetch(`/api/analytics/technicians?${queryString}`),
        fetch("/api/analytics/equipment"),
      ]);

      if (kpiRes.ok) {
        const json = await kpiRes.json();
        setKpis(json.data);
      }
      if (trendRes.ok) {
        const json = await trendRes.json();
        setTrends(json.data);
      }
      if (techRes.ok) {
        const json = await techRes.json();
        setTechStats(json.data);
      }
      if (equipmentRes.ok) {
        const json = await equipmentRes.json();
        setEquipmentStats(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedTechnicianId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border bg-card/50">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Filters
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <TechnicianSelect
          value={selectedTechnicianId}
          onChange={setSelectedTechnicianId}
          className="w-48"
        />
      </div>

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

      <ErrorBoundary fallback={<div>Failed to load Predictions</div>}>
        <PredictiveMaintenanceWidget />
      </ErrorBoundary>
    </div>
  );
}
