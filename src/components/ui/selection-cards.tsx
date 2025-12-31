import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type * as React from "react";

interface SelectionCardProps {
  selected?: boolean;
  onClick?: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SelectionCard({
  selected,
  onClick,
  label,
  description,
  icon,
  className,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50",
        className
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30"
        )}
      >
        {selected && (icon || <Check className="h-3 w-3" />)}
      </div>
      <div>
        <p className="font-bold text-sm uppercase tracking-wide">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}

export function SelectionGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>{children}</div>
  );
}
