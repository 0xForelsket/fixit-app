"use client";

import { acknowledgePrediction } from "@/actions/predictions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EquipmentPrediction } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { useTransition } from "react";

interface PredictionsCardProps {
  predictions: EquipmentPrediction[];
  className?: string;
}

export function PredictionsCard({
  predictions,
  className,
}: PredictionsCardProps) {
  const [isPending, startTransition] = useTransition();

  // Get the most recent/highest risk prediction
  const activePrediction = predictions[0];

  if (!activePrediction) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Failure Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
            <p className="text-sm font-medium">No Active Predictions</p>
            <p className="text-xs mt-1">
              Equipment is operating within normal parameters
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const probability = Number.parseFloat(activePrediction.probability) * 100;
  const confidence = activePrediction.confidence
    ? Number.parseFloat(activePrediction.confidence) * 100
    : 50;

  const factors = activePrediction.factors
    ? JSON.parse(activePrediction.factors)
    : null;

  // Determine risk level colors
  const getRiskColors = (prob: number) => {
    if (prob >= 70)
      return {
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-900/50",
        text: "text-rose-700 dark:text-rose-400",
        badge:
          "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
      };
    if (prob >= 50)
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-900/50",
        text: "text-amber-700 dark:text-amber-400",
        badge:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
      };
    if (prob >= 25)
      return {
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        border: "border-yellow-200 dark:border-yellow-900/50",
        text: "text-yellow-700 dark:text-yellow-400",
        badge:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      };
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-900/50",
      text: "text-emerald-700 dark:text-emerald-400",
      badge:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    };
  };

  const colors = getRiskColors(probability);

  const formatTimeToFailure = () => {
    if (!activePrediction.estimatedDate) return null;
    const now = new Date();
    const estimated = new Date(activePrediction.estimatedDate);
    const hoursRemaining =
      (estimated.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return "Overdue";
    if (hoursRemaining < 24) return `${Math.round(hoursRemaining)} hours`;
    if (hoursRemaining < 168) return `${Math.round(hoursRemaining / 24)} days`;
    return `${Math.round(hoursRemaining / 168)} weeks`;
  };

  const handleAcknowledge = () => {
    startTransition(async () => {
      await acknowledgePrediction(activePrediction.id);
    });
  };

  return (
    <Card
      className={cn("overflow-hidden", colors.bg, colors.border, className)}
    >
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={cn("h-4 w-4", colors.text)} />
            Failure Prediction
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Predicted based on MTBF analysis, downtime history, and
                    maintenance patterns.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          {predictions.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{predictions.length - 1} more
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={cn("text-3xl font-bold tabular-nums", colors.text)}>
              {probability.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Failure Probability
            </div>
          </div>

          {formatTimeToFailure() && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-lg font-semibold">
                <Clock className="h-4 w-4" />
                {formatTimeToFailure()}
              </div>
              <div className="text-xs text-muted-foreground">
                Estimated Time to Failure
              </div>
            </div>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Model Confidence</span>
            <span>{confidence.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 transition-all"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Risk Factors */}
        {factors && (
          <div className="space-y-2 mb-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Risk Factors
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span>MTBF: {Math.round(factors.mtbf)}h</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Since Last: {Math.round(factors.timeSinceLastFailure)}h
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Trend: {factors.downtimeFrequencyTrend}</span>
              </div>
              {factors.upcomingMaintenanceCount > 0 && (
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>{factors.upcomingMaintenanceCount} PM due</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAcknowledge}
          disabled={isPending}
        >
          {isPending ? "Acknowledging..." : "Acknowledge & Dismiss"}
        </Button>
      </CardContent>
    </Card>
  );
}
