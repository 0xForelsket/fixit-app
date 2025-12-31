"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface WorkOrderFiltersProps {
  searchParams: {
    status?: string;
    priority?: string;
    search?: string;
    assigned?: string;
    overdue?: string;
    dateRange?: string;
  };
  hasActiveFilters: boolean;
}

export function WorkOrderFilters({
  searchParams,
  hasActiveFilters,
}: WorkOrderFiltersProps) {
  return (
    <FilterBar
      basePath="/maintenance/work-orders"
      searchParams={searchParams}
      searchPlaceholder="FILTER BY TITLE, DESCRIPTION OR ASSET..."
      hasActiveFilters={hasActiveFilters}
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
          ],
          minWidth: "140px",
        },
      ]}
    />
  );
}
