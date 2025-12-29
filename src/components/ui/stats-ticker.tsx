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
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr gap-[1px] bg-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700",
      isCompact && "rounded-xl shadow-lg",
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
              "bg-card p-6 flex flex-col gap-4 relative overflow-hidden group transition-all hover:bg-muted/50",
              isCompact && "p-4 gap-2",
              isDanger && "bg-rose-500/5",
              isWarning && "bg-amber-500/5",
              isSuccess && "bg-emerald-500/5",
              isPrimary && "bg-primary-500/5"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                isCompact && "text-[9px] tracking-wider"
              )}>{stat.label}</span>
              <Icon className={cn(
                "h-4 w-4", 
                isCompact && "h-3 w-3",
                isDanger ? "text-rose-500 animate-pulse" : 
                isWarning ? "text-amber-500" : 
                isSuccess ? "text-emerald-500" : 
                isPrimary ? "text-primary-500" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-5xl font-mono font-black tracking-tighter",
                isCompact && "text-3xl",
                isDanger ? "text-rose-500" : 
                isWarning ? "text-amber-500" : 
                isSuccess ? "text-emerald-500" : 
                isPrimary ? "text-primary-500" : "text-foreground"
              )}>
                {String(stat.value).padStart(2, '0')}
              </span>
              {stat.trend !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                  stat.trend > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10",
                  isCompact && "text-[8px] px-1"
                )}>
                  {stat.trend > 0 ? "+" : ""}{stat.trend}%
                </div>
              )}
            </div>
            {stat.trendLabel && (
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {stat.trendLabel}
              </span>
            )}
            
            {/* Accent Line */}
            <div className={cn(
              "absolute bottom-0 left-0 w-full h-1 opacity-50 bg-gradient-to-r from-transparent via-border to-transparent",
              isDanger && "from-rose-500",
              isWarning && "from-amber-500",
              isSuccess && "from-emerald-500",
              isPrimary && "from-primary-500"
            )} />
          </div>
        );
      })}
    </div>
  );
}
