import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "danger" | "warning" | "success" | "primary";
  trend?: number;
  trendLabel?: string;
}

interface StatsTickerProps {
  stats: StatItem[];
  className?: string;
  variant?: "default" | "compact";
}

export function StatsTicker({
  stats,
  className,
  variant = "default",
}: StatsTickerProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "w-full bg-card rounded-xl border shadow-sm overflow-hidden",
        // Desktop Layout Logic:
        // - lg: Flow columns (single row)
        // - gap-[1px] bg-border for grid dividers
        "lg:grid lg:grid-flow-col lg:auto-cols-fr lg:gap-[1px] lg:bg-border",
        // Mobile/Tablet Layout:
        // - Flex row with horizontal scroll to save vertical space
        "flex lg:flex-none flex-nowrap overflow-x-auto scrollbar-none",
        className
      )}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        const isDanger = stat.variant === "danger";
        const isWarning = stat.variant === "warning";
        const isSuccess = stat.variant === "success";
        const isPrimary = stat.variant === "primary";

        return (
          <div
            key={i}
            className={cn(
              "bg-card transition-colors shrink-0",
              // Mobile specific sizing: very compact
              "w-[130px] sm:w-[150px] lg:w-auto",
              "p-2.5 sm:p-4 lg:p-6 flex flex-col justify-between gap-0.5 sm:gap-2 relative overflow-hidden group hover:bg-muted/50",
              // Borders for mobile
              "border-r border-border last:border-r-0 lg:border-none",

              isCompact && "p-2 sm:p-3 lg:p-4",
              // Subtle colored backgrounds
              isDanger && "bg-rose-500/5 hover:bg-rose-500/10",
              isWarning && "bg-amber-500/5 hover:bg-amber-500/10",
              isSuccess && "bg-emerald-500/5 hover:bg-emerald-500/10",
              isPrimary && "bg-primary-500/5 hover:bg-primary-500/10"
            )}
          >
            {/* Header: Label & Icon */}
            <div className="flex items-center justify-between z-10 w-full mb-1 sm:mb-0">
              <span
                className={cn(
                  "text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate",
                  !isCompact && "lg:text-[10px]"
                )}
              >
                {stat.label}
              </span>
              <Icon
                className={cn(
                  "h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 opacity-75 group-hover:opacity-100 transition-opacity shrink-0",
                  isDanger
                    ? "text-rose-500"
                    : isWarning
                      ? "text-amber-500"
                      : isSuccess
                        ? "text-emerald-500"
                        : isPrimary
                          ? "text-primary-500"
                          : "text-foreground"
                )}
              />
            </div>

            {/* Value & Trend */}
            <div className="flex items-end justify-between z-10">
              <span
                className={cn(
                  "font-mono font-black tracking-tighter tabular-nums leading-none",
                  // Ultra compact text on mobile
                  "text-lg sm:text-2xl lg:text-3xl",
                  !isCompact && "lg:text-4xl",

                  isDanger
                    ? "text-rose-600"
                    : isWarning
                      ? "text-amber-600"
                      : isSuccess
                        ? "text-emerald-600"
                        : isPrimary
                          ? "text-primary-600"
                          : "text-foreground"
                )}
              >
                {String(stat.value).padStart(2, "0")}
              </span>

              {stat.trend !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded",
                    stat.trend > 0
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-rose-700 bg-rose-100"
                  )}
                >
                  {stat.trend > 0 ? "↑" : "↓"} {Math.abs(stat.trend)}%
                </div>
              )}
            </div>

            {/* Decorative bottom accent bar */}
            <div
              className={cn(
                "absolute bottom-0 left-0 w-full h-0.5 opacity-40 group-hover:opacity-100 transition-opacity",
                isDanger
                  ? "bg-rose-500"
                  : isWarning
                    ? "bg-amber-500"
                    : isSuccess
                      ? "bg-emerald-500"
                      : isPrimary
                        ? "bg-primary-500"
                        : "bg-foreground/20"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
