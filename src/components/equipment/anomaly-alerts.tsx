"use client";

import { resolveAnomaly } from "@/actions/predictions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  EquipmentMeter,
  MeterAnomaly,
  MeterReading,
  WorkOrder,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  MinusCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

type AnomalyWithRelations = MeterAnomaly & {
  meter?: EquipmentMeter | null;
  reading?: MeterReading | null;
  workOrder?: WorkOrder | null;
};

interface AnomalyAlertsProps {
  anomalies: AnomalyWithRelations[];
  className?: string;
}

const severityConfig = {
  low: {
    icon: MinusCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  medium: {
    icon: TrendingUp,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  },
  high: {
    icon: TrendingDown,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  critical: {
    icon: AlertTriangle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
  },
};

export function AnomalyAlerts({ anomalies, className }: AnomalyAlertsProps) {
  const [isPending, startTransition] = useTransition();

  if (anomalies.length === 0) return null;

  const handleResolve = (anomalyId: string) => {
    startTransition(async () => {
      await resolveAnomaly(anomalyId);
    });
  };

  // Group by severity for better UX
  const criticalAnomalies = anomalies.filter((a) => a.severity === "critical");
  const highAnomalies = anomalies.filter((a) => a.severity === "high");
  const otherAnomalies = anomalies.filter(
    (a) => a.severity === "medium" || a.severity === "low"
  );

  const sortedAnomalies = [
    ...criticalAnomalies,
    ...highAnomalies,
    ...otherAnomalies,
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span>Active Anomalies ({anomalies.length})</span>
      </div>

      <div className="space-y-2">
        {sortedAnomalies.slice(0, 3).map((anomaly) => {
          const config =
            severityConfig[anomaly.severity as keyof typeof severityConfig];
          const Icon = config.icon;

          return (
            <div
              key={anomaly.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                config.bg,
                config.border
              )}
            >
              <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.color)} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {anomaly.meter?.name || "Meter"} Reading Anomaly
                  </span>
                  <Badge
                    className={cn("text-[10px] font-semibold", config.badge)}
                  >
                    {anomaly.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {anomaly.anomalyType.replace("_", " ")}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Expected:{" "}
                  {Number.parseFloat(anomaly.expectedValue).toFixed(2)} •
                  Actual: {Number.parseFloat(anomaly.actualValue).toFixed(2)} •
                  Deviation:{" "}
                  {Number.parseFloat(anomaly.deviationPercent).toFixed(1)}%
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {anomaly.workOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      asChild
                    >
                      <Link
                        href={`/maintenance/work-orders/${anomaly.workOrder.displayId}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        WO #{anomaly.workOrder.displayId}
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleResolve(anomaly.id)}
                    disabled={isPending}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Resolve
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedAnomalies.length > 3 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            +{sortedAnomalies.length - 3} more anomalies
          </div>
        )}
      </div>
    </div>
  );
}
