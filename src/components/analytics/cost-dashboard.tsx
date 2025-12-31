"use client";

import {
  type CostFilters,
  type CostSummary,
  getCostSummary,
  getDepartmentsForFilter,
  getEquipmentForFilter,
} from "@/actions/costs";
import { CostByDepartmentChart } from "@/components/analytics/cost-by-department-chart";
import { CostByEquipmentChart } from "@/components/analytics/cost-by-equipment-chart";
import { CostDistributionChart } from "@/components/analytics/cost-distribution-chart";
import { CostTrendChart } from "@/components/analytics/cost-trend-chart";
import { CostlyWorkOrdersTable } from "@/components/analytics/costly-work-orders-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Calculator,
  DollarSign,
  Hammer,
  Package,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface FilterOption {
  id: number;
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

export function CostDashboard() {
  const [costData, setCostData] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [equipmentList, setEquipmentList] = useState<FilterOption[]>([]);
  const [departmentList, setDepartmentList] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<CostFilters>({});
  const [dateRange, setDateRange] = useState<string>("all");

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
    } catch (err) {
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
      equipmentId: value === "all" ? undefined : Number(value),
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      departmentId: value === "all" ? undefined : Number(value),
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
      <Card className="card-industrial border-zinc-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Date Range
              </Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Equipment
              </Label>
              <Select
                value={filters.equipmentId?.toString() || "all"}
                onValueChange={handleEquipmentChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {equipmentList.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id.toString()}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Department
              </Label>
              <Select
                value={filters.departmentId?.toString() || "all"}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentList.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

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
