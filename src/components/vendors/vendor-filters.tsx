"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface VendorFiltersProps {
  searchParams: {
    q?: string;
  };
}

export function VendorFilters({ searchParams }: VendorFiltersProps) {
  return (
    <FilterBar
      basePath="/assets/vendors"
      searchParams={searchParams}
      searchPlaceholder="SEARCH BY NAME OR CODE..."
      searchParamName="q"
    />
  );
}
