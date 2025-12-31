"use client";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import type { SelectOption } from "@/components/ui/styled-select";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";

export interface FilterConfig {
  /** The URL parameter name for this filter */
  name: string;
  /** Available options for the filter dropdown */
  options: SelectOption[];
  /** Minimum width for the dropdown (default: "140px") */
  minWidth?: string;
}

export interface FilterBarProps {
  /** Base path for navigation (e.g., "/assets/equipment") */
  basePath: string;
  /** Current search params */
  searchParams: Record<string, string | undefined>;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** URL parameter name for search (default: "search") */
  searchParamName?: string;
  /** Filter dropdown configurations */
  filters?: FilterConfig[];
  /** Whether to show custom date range (from/to) inputs */
  enableCustomDateRange?: boolean;
  /** Optional override for active filters state */
  hasActiveFilters?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** Whether to trigger search automatically while typing (debounced) */
  enableRealtimeSearch?: boolean;
}

export function FilterBar({
  basePath,
  searchParams,
  searchPlaceholder = "SEARCH...",
  searchParamName = "search",
  filters = [],
  hasActiveFilters: hasActiveFiltersOverride,
  enableCustomDateRange = false,
  className,
  enableRealtimeSearch = false,
}: FilterBarProps) {
  const router = useRouter();
  const nextSearchParams = useSearchParams();

  const searchValue = searchParams[searchParamName] || "";
  const [inputValue, setInputValue] = useState(searchValue);
  const debouncedSearchValue = useDebounce(inputValue, 500);

  // Keep internal state in sync with external prop changes (e.g., Reset All)
  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  const updateFilters = useCallback(
    (search: string) => {
      const params = new URLSearchParams(nextSearchParams.toString());

      if (search) {
        params.set(searchParamName, search);
      } else {
        params.delete(searchParamName);
      }

      // Always reset to first page when search changes
      params.delete("page");

      const queryString = params.toString();
      router.push(`${basePath}${queryString ? `?${queryString}` : ""}`);
    },
    [basePath, router, nextSearchParams, searchParamName]
  );

  useEffect(() => {
    if (enableRealtimeSearch && debouncedSearchValue !== searchValue) {
      updateFilters(debouncedSearchValue);
    }
  }, [debouncedSearchValue, enableRealtimeSearch, searchValue, updateFilters]);

  const hasActiveFilters =
    hasActiveFiltersOverride ??
    !!(
      searchValue ||
      searchParams.from ||
      searchParams.to ||
      filters.some((filter) => {
        const value = searchParams[filter.name];
        return value && value !== "all";
      })
    );

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get(searchParamName) as string;

    const params = new URLSearchParams(nextSearchParams.toString());
    if (search) {
      params.set(searchParamName, search);
    } else {
      params.delete(searchParamName);
    }

    if (enableCustomDateRange) {
      const from = formData.get("from") as string;
      const to = formData.get("to") as string;
      if (from) params.set("from", from);
      else params.delete("from");

      if (to) params.set("to", to);
      else params.delete("to");
    }

    // Always reset to first page when search/dates change
    params.delete("page");

    const queryString = params.toString();
    router.push(`${basePath}${queryString ? `?${queryString}` : ""}`);
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete(searchParamName);
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div
      className={
        className ??
        "flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/60 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] ring-1 ring-black/5"
      }
    >
      <form
        className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-2 relative group"
        onSubmit={handleSearchSubmit}
      >
        <div className="flex-1 relative">
          <input
            type="text"
            name={searchParamName}
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full h-10 rounded-lg border-2 border-border/50 bg-card/80 pl-4 pr-11 text-[11px] font-bold uppercase tracking-[0.05em] transition-all placeholder:text-muted-foreground/40 focus-visible:border-primary/50 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
          />
          {inputValue ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground/50 hover:text-danger transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-200 group-focus-within:scale-110">
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            </div>
          )}
        </div>

        {enableCustomDateRange && (
          <div className="flex items-center gap-2">
            <div className="relative group/date">
              <span className="absolute -top-2 left-2 px-1 bg-muted/40 text-[8px] font-black text-muted-foreground/60 tracking-tighter transition-colors group-focus-within/date:text-primary">
                FROM
              </span>
              <input
                type="date"
                name="from"
                defaultValue={searchParams.from}
                className="h-10 rounded-lg border-2 border-border/50 bg-card/80 px-3 text-[10px] font-bold uppercase tracking-wider transition-all focus-visible:border-primary/50 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5"
              />
            </div>
            <span className="text-[10px] font-black text-muted-foreground/40">
              —
            </span>
            <div className="relative group/date">
              <span className="absolute -top-2 left-2 px-1 bg-muted/40 text-[8px] font-black text-muted-foreground/60 tracking-tighter transition-colors group-focus-within/date:text-primary">
                TO
              </span>
              <input
                type="date"
                name="to"
                defaultValue={searchParams.to}
                className="h-10 rounded-lg border-2 border-border/50 bg-card/80 px-3 text-[10px] font-bold uppercase tracking-wider transition-all focus-visible:border-primary/50 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-10 px-4 rounded-lg text-[9px] font-black uppercase tracking-wider active:scale-95"
            >
              APPLY
            </Button>
          </div>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <FilterSelect
            key={filter.name}
            name={filter.name}
            value={searchParams[filter.name] || "all"}
            options={filter.options}
            basePath={basePath}
            searchParams={searchParams}
            minWidth={filter.minWidth}
          />
        ))}

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-lg bg-background/50 border-2 border-border/40 hover:border-danger hover:bg-danger/5 hover:text-danger text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 group shadow-sm"
            asChild
          >
            <Link href={basePath}>
              <X className="mr-2 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-200" />
              RESET ALL
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
