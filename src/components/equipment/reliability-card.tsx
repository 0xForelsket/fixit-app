import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Activity, Clock, HelpCircle, Timer, TrendingUp } from "lucide-react";

interface ReliabilityMetrics {
  mtbf: number; // Mean Time Between Failures (hours)
  mttr: number; // Mean Time To Repair (hours)
  availability: number; // Percentage (0-100)
  totalDowntime: number; // Total downtime hours
  periodDays: number; // Period over which metrics were calculated (e.g., 365)
}

interface ReliabilityCardProps {
  metrics: ReliabilityMetrics;
  className?: string; // Add className prop for flexibility
}

export function ReliabilityCard({ metrics, className }: ReliabilityCardProps) {
  // Determine color coding for availability
  const isHighAvailability = metrics.availability >= 98;
  const isMediumAvailability =
    metrics.availability >= 90 && metrics.availability < 98;

  const availabilityColor = isHighAvailability
    ? "text-emerald-700 dark:text-emerald-400"
    : isMediumAvailability
      ? "text-amber-700 dark:text-amber-400"
      : "text-rose-700 dark:text-rose-400";

  const availabilityBg = isHighAvailability
    ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/50"
    : isMediumAvailability
      ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/50"
      : "bg-rose-50/50 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/50";

  return (
    <Card
      className={cn("overflow-hidden border-border/50 shadow-sm", className)}
    >
      <CardHeader className="pb-4 border-b bg-muted/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Reliability Metrics
            </CardTitle>
            <CardDescription className="text-xs">
              Performance indicators over the last {metrics.periodDays} days
            </CardDescription>
          </div>
          {/* Optional: Add a sparkline or simple trend indicator here if data is available in the future */}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Availability */}
          <div
            className={cn(
              "p-6 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors",
              availabilityBg
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Availability
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1">
                      <p className="font-semibold">Equipment Availability</p>
                      <p className="text-xs max-w-xs text-muted-foreground">
                        The percentage of time the equipment was healthy and
                        available for production.
                      </p>
                      <div className="text-[10px] bg-muted p-1 rounded font-mono mt-1">
                        (Total Time - Downtime) / Total Time
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div
              className={cn(
                "text-4xl font-black tracking-tight tabular-nums my-1",
                availabilityColor
              )}
            >
              {metrics.availability.toFixed(1)}%
            </div>

            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 border text-[11px] font-medium text-muted-foreground shadow-sm">
              <TrendingUp className="h-3 w-3" />
              <span className="tabular-nums">
                {metrics.totalDowntime.toFixed(1)}h
              </span>{" "}
              downtime
            </div>
          </div>

          {/* MTBF */}
          <div className="p-6 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors bg-card">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              MTBF
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Mean Time Between Failures
                      </p>
                      <p className="text-xs max-w-xs text-muted-foreground">
                        Average time the equipment runs successfully between
                        breakdowns. Higher is better.
                      </p>
                      <div className="text-[10px] bg-muted p-1 rounded font-mono mt-1">
                        Total Uptime / Count of Failures
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="text-3xl font-bold tracking-tight varial-nums text-foreground my-1 flex items-baseline gap-1">
              {metrics.mtbf > 1000
                ? `${(metrics.mtbf / 1000).toFixed(1)}k`
                : Math.round(metrics.mtbf).toLocaleString()}
              <span className="text-sm font-medium text-muted-foreground/70">
                hrs
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Average Uptime
            </div>
          </div>

          {/* MTTR */}
          <div className="p-6 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors bg-card">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              MTTR
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1">
                      <p className="font-semibold">Mean Time To Repair</p>
                      <p className="text-xs max-w-xs text-muted-foreground">
                        Average time spent fixing the equipment when it breaks.
                        Lower is better.
                      </p>
                      <div className="text-[10px] bg-muted p-1 rounded font-mono mt-1">
                        Total Downtime / Count of Failures
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="text-3xl font-bold tracking-tight text-foreground my-1 flex items-baseline gap-1">
              {metrics.mttr.toFixed(1)}
              <span className="text-sm font-medium text-muted-foreground/70">
                hrs
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              Average Repair
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
