"use client";

import {
  type DowntimeFilters,
  type DowntimeSummary,
  getDepartmentsForDowntimeFilter,
  getDowntimeSummary,
} from "@/actions/downtime";
import { DowntimeByEquipmentChart } from "@/components/analytics/downtime-by-equipment-chart";
import { DowntimeByReasonChart } from "@/components/analytics/downtime-by-reason-chart";
import { DowntimeTrendChart } from "@/components/analytics/downtime-trend-chart";
import { RecentDowntimeTable } from "@/components/analytics/recent-downtime-table";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  FilterToolbar,
  FilterToolbarGroup,
} from "@/components/ui/filter-toolbar";
import { ResetFilterButton } from "@/components/ui/reset-filter-button";
import { StatsCard } from "@/components/ui/stats-card";
import { StyledSelect } from "@/components/ui/styled-select";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FilterOption {
  id: number;
  name: string;
  code: string;
}

function formatHours(hours: number): string {
  if (hours >= 1000) {
    return `${(hours / 1000).toFixed(1)}K hrs`;
  }
  if (hours >= 1) {
    return `${hours.toFixed(1)} hrs`;
  }
  return `${(hours * 60).toFixed(0)} min`;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "ALL TIME" },
  { value: "7d", label: "LAST 7 DAYS" },
  { value: "30d", label: "LAST 30 DAYS" },
  { value: "90d", label: "LAST 90 DAYS" },
  { value: "1y", label: "LAST YEAR" },
  { value: "ytd", label: "YEAR TO DATE" },
];

export function DowntimeDashboard() {
  const [downtimeData, setDowntimeData] = useState<DowntimeSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [departmentList, setDepartmentList] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<DowntimeFilters>({});
  const [dateRange, setDateRange] = useState<string>("30d");

  // Memoized options for StyledSelect
  const departmentOptions = useMemo(
    () => [
      { value: "all", label: "ALL DEPARTMENTS" },
      ...departmentList.map((d) => ({
        value: d.id.toString(),
        label: d.name.toUpperCase(),
      })),
    ],
    [departmentList]
  );

  // Load filter options
  useEffect(() => {
    async function loadFilterOptions() {
      const departmentResult = await getDepartmentsForDowntimeFilter();

      if (departmentResult.success && departmentResult.data) {
        setDepartmentList(departmentResult.data);
      }
    }
    loadFilterOptions();
  }, []);

  // Initialize default date filter
  useEffect(() => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate: now,
    }));
  }, []);

  // Load downtime data
  const loadDowntimeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDowntimeSummary(filters);
      if (result.success && result.data) {
        setDowntimeData(result.data);
      } else if (!result.success) {
        setError(result.error || "Failed to load downtime data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (filters.startDate) {
      loadDowntimeData();
    }
  }, [loadDowntimeData, filters.startDate]);

  // Handle date range changes
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const now = new Date();
    let startDate: Date | undefined;

    switch (value) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = undefined;
    }

    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate: value === "all" ? undefined : now,
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      departmentId: value === "all" ? undefined : Number(value),
    }));
  };

  const handleReset = () => {
    setDateRange("30d");
    const now = new Date();
    setFilters({
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="h-10 w-10 border-4 border-zinc-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-mono text-xs font-bold uppercase tracking-widest">
          Calculating Downtime...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <p className="text-danger-600 font-semibold">{error}</p>
        <Button onClick={loadDowntimeData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <FilterToolbar>
        <FilterToolbarGroup>
          <StyledSelect
            label="Date Range"
            value={dateRange}
            onValueChange={handleDateRangeChange}
            options={DATE_RANGE_OPTIONS}
            minWidth="150px"
          />
          <StyledSelect
            label="Department"
            value={filters.departmentId?.toString() || "all"}
            onValueChange={handleDepartmentChange}
            options={departmentOptions}
            minWidth="170px"
          />
        </FilterToolbarGroup>
        <ResetFilterButton onClick={handleReset} />
      </FilterToolbar>

      {/* Summary KPIs */}
      <ErrorBoundary fallback={<div>Failed to load downtime summary</div>}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Downtime"
            value={formatHours(downtimeData?.totalDowntimeHours || 0)}
            description="Cumulative downtime"
            icon={Clock}
            variant="danger"
          />
          <StatsCard
            title="Availability"
            value={formatPercentage(
              downtimeData?.availabilityPercentage || 100
            )}
            description="Equipment uptime"
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Incidents"
            value={String(downtimeData?.incidentCount || 0)}
            description="Downtime events"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Avg per Incident"
            value={formatHours(downtimeData?.averageDowntimePerIncident || 0)}
            description="Mean time to repair"
            icon={TrendingDown}
            variant="secondary"
          />
        </div>
      </ErrorBoundary>

      {/* Charts Row 1: Trend and Equipment */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <ErrorBoundary fallback={<div>Failed to load downtime trend</div>}>
          <DowntimeTrendChart data={downtimeData?.downtimeByMonth || []} />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div>Failed to load downtime by reason</div>}>
          <DowntimeByReasonChart data={downtimeData?.downtimeByReason || []} />
        </ErrorBoundary>
      </div>

      {/* Charts Row 2: Top Equipment by Downtime */}
      <ErrorBoundary fallback={<div>Failed to load equipment downtime</div>}>
        <DowntimeByEquipmentChart
          data={downtimeData?.downtimeByEquipment || []}
        />
      </ErrorBoundary>

      {/* Recent Downtime Events Table */}
      <ErrorBoundary fallback={<div>Failed to load recent events</div>}>
        <RecentDowntimeTable data={downtimeData?.recentDowntimeEvents || []} />
      </ErrorBoundary>
    </div>
  );
}
