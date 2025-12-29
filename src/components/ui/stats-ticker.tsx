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

export function StatsTicker({ stats, className, variant = "default" }: StatsTickerProps) {
  const isCompact = variant === "compact";

  return (
    <div className={cn(
      "w-full bg-card rounded-xl border shadow-sm overflow-hidden",
      // Grid Layout Logic:
      // - Mobile: 1 column
      // - Tablet (sm): 2 columns
      // - Desktop (lg): Flow columns (single row if possible)
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr",
      // divider implementation using gap and background color for "border" look
      "gap-[1px] bg-border",
      className
    )}>
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
              "bg-card p-5 lg:p-6 flex flex-col justify-between gap-3 relative overflow-hidden group hover:bg-muted/50 transition-colors",
              isCompact && "p-4 gap-2",
              // Subtle colored backgrounds for active states
              isDanger && "hover:bg-rose-500/5",
              isWarning && "hover:bg-amber-500/5",
              isSuccess && "hover:bg-emerald-500/5",
              isPrimary && "hover:bg-primary-500/5"
            )}
          >
            {/* Header: Label & Icon */}
            <div className="flex items-center justify-between z-10">
              <span className={cn(
                "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
                isCompact && "text-[9px]"
              )}>{stat.label}</span>
              <Icon className={cn(
                "h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity", 
                isDanger ? "text-rose-500" : 
                isWarning ? "text-amber-500" : 
                isSuccess ? "text-emerald-500" : 
                isPrimary ? "text-primary-500" : "text-foreground"
              )} />
            </div>

            {/* Value & Trend */}
            <div className="flex items-end justify-between z-10 mt-1">
              <span className={cn(
                "font-mono font-black tracking-tighter tabular-nums leading-none",
                // Reduced text sizes for better density
                isCompact ? "text-2xl lg:text-3xl" : "text-3xl lg:text-4xl",
                isDanger ? "text-rose-600" : 
                isWarning ? "text-amber-600" : 
                isSuccess ? "text-emerald-600" : 
                isPrimary ? "text-primary-600" : "text-foreground"
              )}>
                {String(stat.value).padStart(2, '0')}
              </span>

              {stat.trend !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                  stat.trend > 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
                )}>
                  {stat.trend > 0 ? "↑" : "↓"} {Math.abs(stat.trend)}%
                </div>
              )}
            </div>
            
            {/* Decorative bottom accent bar */}
            <div className={cn(
              "absolute bottom-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
              isDanger ? "bg-rose-500" : 
              isWarning ? "bg-amber-500" : 
              isSuccess ? "bg-emerald-500" : 
              isPrimary ? "bg-primary-500" : "bg-foreground/20"
            )} />
          </div>
        );
      })}
    </div>
  );
}
