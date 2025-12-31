"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

export interface SelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  /** Label shown in dropdown header */
  label: string;
  /** Current selected value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Available options */
  options: SelectOption[];
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Additional className for the trigger */
  className?: string;
  /** Minimum width for the trigger */
  minWidth?: string;
  /** Whether this filter has an active (non-default) value */
  isActive?: boolean;
  /** Whether the component is in a loading/pending state */
  isPending?: boolean;
}

/**
 * A styled select dropdown with industrial design.
 * Works with client-side state (value + onValueChange).
 * For URL-based filtering, use FilterSelect instead.
 */
export function StyledSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  minWidth = "140px",
  isActive,
  isPending = false,
}: StyledSelectProps) {
  const currentOption = options.find((o) => o.value === value);
  const displayLabel = currentOption?.label || placeholder || options[0]?.label;

  // Auto-detect active state if not explicitly provided
  const isFiltered = isActive ?? (value !== "all" && value !== "");

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "group relative flex items-center justify-between gap-4 rounded-lg border-2 py-2.5 pl-3 pr-3 text-[10px] font-black uppercase tracking-wider transition-all h-10 w-full md:w-auto active:scale-[0.97]",
          "[&>svg]:hidden", // Hide the default chevron
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
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            isFiltered
              ? "text-primary"
              : "text-muted-foreground/60 group-hover:text-foreground",
            "group-data-[state=open]:rotate-180"
          )}
        />
      </SelectTrigger>
      <SelectContent
        className="min-w-[200px] rounded-xl border border-border bg-popover/98 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ease-out"
        position="popper"
        sideOffset={6}
      >
        <div className="p-1.5">
          <div className="px-2 py-2 mb-1 text-[9px] font-black text-muted-foreground/60 tracking-[0.25em] uppercase border-b border-border/50">
            {label}
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
