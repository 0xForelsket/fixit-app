"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface ReportsFiltersProps {
  searchParams: {
    status?: string;
    priority?: string;
    search?: string;
    dateRange?: string;
    from?: string;
    to?: string;
  };
  hasActiveFilters: boolean;
}

export function ReportsFilters({
  searchParams,
  hasActiveFilters,
}: ReportsFiltersProps) {
  return (
    <FilterBar
      basePath="/reports"
      searchParams={searchParams}
      searchPlaceholder="SEARCH BY TITLE, ID OR DESCRIPTION..."
      hasActiveFilters={hasActiveFilters}
      enableCustomDateRange
      enableRealtimeSearch={true}
      filters={[
        {
          name: "status",
          options: [
            { value: "all", label: "ANY STATUS" },
            { value: "open", label: "OPEN" },
            { value: "in_progress", label: "IN PROGRESS" },
            { value: "on_hold", label: "ON HOLD" },
            { value: "resolved", label: "RESOLVED" },
            { value: "closed", label: "CLOSED" },
          ],
          minWidth: "140px",
        },
        {
          name: "priority",
          options: [
            { value: "all", label: "ANY PRIORITY" },
            { value: "low", label: "LOW" },
            { value: "medium", label: "MEDIUM" },
            { value: "high", label: "HIGH" },
            { value: "critical", label: "CRITICAL" },
          ],
          minWidth: "140px",
        },
        {
          name: "dateRange",
          options: [
            { value: "all", label: "ANY TIME" },
            { value: "today", label: "TODAY" },
            { value: "7d", label: "LAST 7 DAYS" },
            { value: "30d", label: "LAST 30 DAYS" },
            { value: "month", label: "THIS MONTH" },
            { value: "quarter", label: "LAST QUARTER" },
            { value: "year", label: "THIS YEAR" },
          ],
          minWidth: "140px",
        },
      ]}
    />
  );
}
