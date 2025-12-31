"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface LocationFiltersProps {
  searchParams: {
    search?: string;
  };
}

export function LocationFilters({ searchParams }: LocationFiltersProps) {
  return (
    <FilterBar
      basePath="/assets/locations"
      searchParams={searchParams}
      searchPlaceholder="SEARCH BY NAME OR CODE..."
      enableRealtimeSearch={true}
    />
  );
}
