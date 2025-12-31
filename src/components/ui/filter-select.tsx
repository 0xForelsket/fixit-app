"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** The URL parameter name for this filter */
  name: string;
  /** Current selected value */
  value: string;
  /** Available options */
  options: FilterOption[];
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
 * Uses Radix UI Select for proper accessibility and click-to-open behavior.
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

  const currentOption = options.find((o) => o.value === value);
  const displayLabel = currentOption?.label || placeholder || options[0]?.label;
  const isFiltered = value !== "all" && value !== "";

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        className={cn(
          "group relative flex items-center justify-between gap-4 rounded-lg border-2 py-2.5 pl-3 pr-3 text-[10px] font-black uppercase tracking-wider transition-all h-10 w-full md:w-auto active:scale-[0.97]",
          isFiltered
            ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/10"
            : "border-border/40 bg-card hover:border-border/80 hover:bg-muted text-muted-foreground",
          isPending && "opacity-70 cursor-wait",
          className
        )}
        style={{ minWidth }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {isFiltered && (
            <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          )}
          <span
            className={cn(
              "truncate transition-colors",
              isFiltered
                ? "text-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          >
            {displayLabel}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent
        className="min-w-[200px] rounded-xl border border-border bg-popover/98 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ease-out"
        position="popper"
        sideOffset={6}
      >
        <div className="p-1.5">
          <div className="px-2 py-2 mb-1 text-[9px] font-black text-muted-foreground/60 tracking-[0.25em] uppercase border-b border-border/50">
            Select {name}
          </div>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                "rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer py-2.5 transition-all focus:bg-primary/20 focus:text-primary active:scale-[0.98]",
                option.value === value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
