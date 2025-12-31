"use client";

import { FilterBar } from "@/components/ui/filter-bar";

const categories = [
  { value: "all", label: "ANY CATEGORY" },
  { value: "electrical", label: "ELECTRICAL" },
  { value: "mechanical", label: "MECHANICAL" },
  { value: "hydraulic", label: "HYDRAULIC" },
  { value: "pneumatic", label: "PNEUMATIC" },
  { value: "consumable", label: "CONSUMABLE" },
  { value: "safety", label: "SAFETY" },
  { value: "tooling", label: "TOOLING" },
  { value: "cleaning", label: "CLEANING" },
  { value: "other", label: "OTHER" },
];

interface PartsFiltersProps {
  searchParams: {
    search?: string;
    category?: string;
    filter?: string;
  };
}

export function PartsFilters({ searchParams }: PartsFiltersProps) {
  return (
    <FilterBar
      basePath="/assets/inventory/parts"
      searchParams={searchParams}
      searchPlaceholder="SEARCH BY NAME, SKU, OR BARCODE..."
      enableRealtimeSearch={true}
      filters={[
        {
          name: "category",
          options: categories,
          minWidth: "160px",
        },
      ]}
    />
  );
}
