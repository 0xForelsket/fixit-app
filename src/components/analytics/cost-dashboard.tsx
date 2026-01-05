"use client";

import {
  type CostFilters,
  type CostSummary,
  getCostSummary,
  getDepartmentsForFilter,
  getEquipmentForFilter,
} from "@/actions/costs";
import { CostlyWorkOrdersTable } from "@/components/analytics/costly-work-orders-table";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import dynamic from "next/dynamic";

// Skeleton for chart loading state
function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 w-32 bg-zinc-200 rounded mb-6" />
      <div className="h-[300px] bg-zinc-100 rounded" />
    </div>
  );
}

// Lazy load heavy chart components (recharts is ~200KB gzipped)
const CostByDepartmentChart = dynamic(
  () =>
    import("@/components/analytics/cost-by-department-chart").then(
      (mod) => mod.CostByDepartmentChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const CostByEquipmentChart = dynamic(
  () =>
    import("@/components/analytics/cost-by-equipment-chart").then(
      (mod) => mod.CostByEquipmentChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const CostDistributionChart = dynamic(
  () =>
    import("@/components/analytics/cost-distribution-chart").then(
      (mod) => mod.CostDistributionChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const CostTrendChart = dynamic(
  () =>
    import("@/components/analytics/cost-trend-chart").then(
      (mod) => mod.CostTrendChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
import {
  FilterToolbar,
  FilterToolbarGroup,
} from "@/components/ui/filter-toolbar";
import { ResetFilterButton } from "@/components/ui/reset-filter-button";
import { StatsCard } from "@/components/ui/stats-card";
import { StyledSelect } from "@/components/ui/styled-select";
import {
  Calculator,
  DollarSign,
  Hammer,
  Package,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FilterOption {
  id: string;
  name: string;
  code: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "ALL TIME" },
  { value: "7d", label: "LAST 7 DAYS" },
  { value: "30d", label: "LAST 30 DAYS" },
  { value: "90d", label: "LAST 90 DAYS" },
  { value: "1y", label: "LAST YEAR" },
  { value: "ytd", label: "YEAR TO DATE" },
];

export function CostDashboard() {
  const [costData, setCostData] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [equipmentList, setEquipmentList] = useState<FilterOption[]>([]);
  const [departmentList, setDepartmentList] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<CostFilters>({});
  const [dateRange, setDateRange] = useState<string>("all");

  // Memoized options for StyledSelect
  const equipmentOptions = useMemo(
    () => [
      { value: "all", label: "ALL EQUIPMENT" },
      ...equipmentList.map((eq) => ({
        value: eq.id.toString(),
        label: eq.name.toUpperCase(),
      })),
    ],
    [equipmentList]
  );

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
      const [equipmentResult, departmentResult] = await Promise.all([
        getEquipmentForFilter(),
        getDepartmentsForFilter(),
      ]);

      if (equipmentResult.success && equipmentResult.data) {
        setEquipmentList(equipmentResult.data);
      }
      if (departmentResult.success && departmentResult.data) {
        setDepartmentList(departmentResult.data);
      }
    }
    loadFilterOptions();
  }, []);

  // Load cost data
  const loadCostData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCostSummary(filters);
      if (result.success && result.data) {
        setCostData(result.data);
      } else if (!result.success) {
        setError(result.error || "Failed to load cost data");
      }
    } catch (_err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCostData();
  }, [loadCostData]);

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

  const handleEquipmentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      equipmentId: value === "all" ? undefined : value,
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      departmentId: value === "all" ? undefined : value,
    }));
  };

  const handleReset = () => {
    setDateRange("all");
    setFilters({});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="h-10 w-10 border-4 border-zinc-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-mono text-xs font-bold uppercase tracking-widest">
          Calculating Costs...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <p className="text-danger-600 font-semibold">{error}</p>
        <Button onClick={loadCostData} variant="outline" size="sm">
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
            label="Equipment"
            value={filters.equipmentId?.toString() || "all"}
            onValueChange={handleEquipmentChange}
            options={equipmentOptions}
            minWidth="170px"
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
      <ErrorBoundary fallback={<div>Failed to load cost summary</div>}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Labor Cost"
            value={formatCurrency(costData?.totalLaborCost || 0)}
            description="From labor logs"
            icon={Hammer}
            variant="primary"
          />
          <StatsCard
            title="Total Parts Cost"
            value={formatCurrency(costData?.totalPartsCost || 0)}
            description="From work order parts"
            icon={Package}
            variant="info"
          />
          <StatsCard
            title="Total Cost"
            value={formatCurrency(costData?.totalCost || 0)}
            description="Combined costs"
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Avg Cost / WO"
            value={formatCurrency(costData?.averageCostPerWorkOrder || 0)}
            description={`${costData?.workOrderCount || 0} work orders`}
            icon={Calculator}
            variant="secondary"
          />
        </div>
      </ErrorBoundary>

      {/* Charts Row 1: Cost Trend and Distribution */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <ErrorBoundary fallback={<div>Failed to load cost trend</div>}>
          <CostTrendChart data={costData?.costByMonth || []} />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div>Failed to load cost distribution</div>}>
          <CostDistributionChart
            laborCost={costData?.totalLaborCost || 0}
            partsCost={costData?.totalPartsCost || 0}
          />
        </ErrorBoundary>
      </div>

      {/* Charts Row 2: Equipment and Department */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <ErrorBoundary fallback={<div>Failed to load equipment costs</div>}>
          <CostByEquipmentChart data={costData?.costByEquipment || []} />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div>Failed to load department costs</div>}>
          <CostByDepartmentChart data={costData?.costByDepartment || []} />
        </ErrorBoundary>
      </div>

      {/* Top Costly Work Orders Table */}
      <ErrorBoundary fallback={<div>Failed to load work orders table</div>}>
        <CostlyWorkOrdersTable data={costData?.topCostlyWorkOrders || []} />
      </ErrorBoundary>
    </div>
  );
}
