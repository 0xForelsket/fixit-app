import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "danger" | "warning" | "success" | "primary";
}

interface StatsTickerProps {
  stats: StatItem[];
  className?: string;
}

export function StatsTicker({ stats, className }: StatsTickerProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700",
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
              isDanger && "bg-rose-500/5",
              isWarning && "bg-amber-500/5",
              isSuccess && "bg-emerald-500/5",
              isPrimary && "bg-primary-500/5"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</span>
              <Icon className={cn(
                "h-4 w-4", 
                isDanger ? "text-rose-500 animate-pulse" : 
                isWarning ? "text-amber-500" : 
                isSuccess ? "text-emerald-500" : 
                isPrimary ? "text-primary-500" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-5xl font-mono font-black tracking-tighter",
                isDanger ? "text-rose-500" : 
                isWarning ? "text-amber-500" : 
                isSuccess ? "text-emerald-500" : 
                isPrimary ? "text-primary-500" : "text-foreground"
              )}>
                {typeof stat.value === 'number' ? stat.value.toString().padStart(2, '0') : stat.value}
              </span>
            </div>
            
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
