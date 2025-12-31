"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { type SelectOption, StyledSelect } from "./styled-select";

// Re-export for convenience
export type { SelectOption as FilterOption } from "./styled-select";

interface FilterSelectProps {
  /** The URL parameter name for this filter */
  name: string;
  /** Current selected value */
  value: string;
  /** Available options */
  options: SelectOption[];
  /** Base path for navigation (e.g., "/maintenance/work-orders") */
  basePath: string;
  /** Current search params to preserve */
  searchParams?: Record<string, string | undefined>;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Additional className for the trigger */
  className?: string;
  /** Minimum width for the trigger */
  minWidth?: string;
}

/**
 * A reusable filter dropdown component that updates URL search params.
 * Uses StyledSelect internally for consistent styling.
 * For client-side state management, use StyledSelect directly.
 */
export function FilterSelect({
  name,
  value,
  options,
  basePath,
  searchParams = {},
  placeholder,
  className,
  minWidth = "140px",
}: FilterSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleValueChange = useCallback(
    (newValue: string) => {
      const params = new URLSearchParams();

      // Preserve existing search params
      for (const [key, val] of Object.entries(searchParams)) {
        if (val && key !== name && key !== "page" && val !== "all") {
          params.set(key, val);
        }
      }

      // Set the new filter value (skip if "all")
      if (newValue && newValue !== "all") {
        params.set(name, newValue);
      }

      const queryString = params.toString();
      const url = `${basePath}${queryString ? `?${queryString}` : ""}`;

      startTransition(() => {
        router.push(url);
      });
    },
    [name, basePath, searchParams, router]
  );

  return (
    <StyledSelect
      label={`Select ${name}`}
      value={value}
      onValueChange={handleValueChange}
      options={options}
      placeholder={placeholder}
      className={className}
      minWidth={minWidth}
      isPending={isPending}
    />
  );
}
