import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FilterToolbarProps {
  children: ReactNode;
  className?: string;
}

/**
 * A container component for filter controls with industrial glassmorphism styling.
 * Use this to wrap StyledSelect, FilterSelect, ResetFilterButton, and search inputs.
 */
export function FilterToolbar({ children, className }: FilterToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between",
        "bg-muted/40 p-4 rounded-xl border border-border/60 backdrop-blur-sm",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] ring-1 ring-black/5",
        className
      )}
    >
      {children}
    </div>
  );
}

interface FilterToolbarGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * A flex container for grouping filter controls together.
 */
export function FilterToolbarGroup({
  children,
  className,
}: FilterToolbarGroupProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}
