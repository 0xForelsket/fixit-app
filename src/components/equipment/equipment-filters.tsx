"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface EquipmentFiltersProps {
  searchParams: {
    status?: string;
    location?: string;
    search?: string;
  };
}

export function EquipmentFilters({ searchParams }: EquipmentFiltersProps) {
  return (
    <FilterBar
      basePath="/assets/equipment"
      searchParams={searchParams}
      searchPlaceholder="SEARCH BY NAME OR SERIAL..."
      filters={[
        {
          name: "status",
          options: [
            { value: "all", label: "ANY STATUS" },
            { value: "operational", label: "OPERATIONAL" },
            { value: "down", label: "DOWN" },
            { value: "maintenance", label: "MAINTENANCE" },
          ],
        },
      ]}
    />
  );
}
