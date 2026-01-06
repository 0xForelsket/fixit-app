/**
 * Failure Prediction for Equipment
 *
 * Calculates failure probability based on:
 * - Mean Time Between Failures (MTBF)
 * - Time since last failure
 * - Meter readings approaching maintenance intervals
 */

import type { DowntimeLog, MaintenanceSchedule } from "@/db/schema";

export interface PredictionFactors {
  mtbf: number; // hours
  timeSinceLastFailure: number; // hours
  upcomingMaintenanceCount: number;
  meterIntervalsApproaching: number;
  downtimeFrequencyTrend: "increasing" | "stable" | "decreasing";
}

export interface FailurePrediction {
  probability: number; // 0-1
  confidence: number; // 0-1
  estimatedTimeToFailure: number | null; // hours
  factors: PredictionFactors;
  riskLevel: "low" | "medium" | "high" | "critical";
}

/**
 * Calculate Mean Time Between Failures (MTBF)
 * MTBF = Total Uptime / Number of Failures
 */
export function calculateMTBF(
  downtimeLogs: DowntimeLog[],
  totalOperatingHours: number
): number {
  // Count completed failures (unplanned downtime with end time)
  const isUnplannedFailure = (reasonCode: string) =>
    reasonCode === "mechanical_failure" || reasonCode === "electrical_failure";

  const failures = downtimeLogs.filter(
    (log) => isUnplannedFailure(log.reasonCode) && log.endTime != null
  );

  if (failures.length === 0) {
    // No failures recorded, return a high MTBF (equipment is reliable)
    return totalOperatingHours || 8760; // Default to 1 year in hours if no data
  }

  // Calculate total downtime
  let totalDowntime = 0;
  for (const log of failures) {
    if (log.endTime) {
      const duration =
        (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60 * 60);
      totalDowntime += duration;
    }
  }

  // Total uptime = Total operating hours - Total downtime
  const totalUptime = Math.max(0, totalOperatingHours - totalDowntime);

  return totalUptime / failures.length;
}

/**
 * Calculate time since last failure in hours
 */
export function calculateTimeSinceLastFailure(
  downtimeLogs: DowntimeLog[]
): number {
  const isUnplannedFailure = (reasonCode: string) =>
    reasonCode === "mechanical_failure" || reasonCode === "electrical_failure";

  const failures = downtimeLogs
    .filter((log) => isUnplannedFailure(log.reasonCode) && log.endTime != null)
    .sort((a, b) => {
      const aEnd = a.endTime?.getTime() || 0;
      const bEnd = b.endTime?.getTime() || 0;
      return bEnd - aEnd; // Most recent first
    });

  if (failures.length === 0) {
    return 0; // No failures recorded
  }

  const lastFailure = failures[0];
  const lastFailureEnd = lastFailure.endTime || lastFailure.startTime;
  const hoursSince = (Date.now() - lastFailureEnd.getTime()) / (1000 * 60 * 60);

  return hoursSince;
}

/**
 * Analyze downtime frequency trend over time
 */
export function analyzeDowntimeTrend(
  downtimeLogs: DowntimeLog[]
): "increasing" | "stable" | "decreasing" {
  const isUnplannedFailure = (reasonCode: string) =>
    reasonCode === "mechanical_failure" || reasonCode === "electrical_failure";

  const failures = downtimeLogs.filter((log) =>
    isUnplannedFailure(log.reasonCode)
  );

  if (failures.length < 4) {
    return "stable"; // Not enough data
  }

  // Split into two halves
  const sortedByTime = [...failures].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const midpoint = Math.floor(sortedByTime.length / 2);
  const firstHalf = sortedByTime.slice(0, midpoint);
  const secondHalf = sortedByTime.slice(midpoint);

  // Calculate average interval between failures for each half
  const getAverageInterval = (logs: DowntimeLog[]): number => {
    if (logs.length < 2) return Number.POSITIVE_INFINITY;
    let totalInterval = 0;
    for (let i = 1; i < logs.length; i++) {
      totalInterval +=
        logs[i].startTime.getTime() - logs[i - 1].startTime.getTime();
    }
    return totalInterval / (logs.length - 1);
  };

  const firstHalfInterval = getAverageInterval(firstHalf);
  const secondHalfInterval = getAverageInterval(secondHalf);

  // Compare intervals (shorter interval = more frequent failures)
  const ratio = secondHalfInterval / firstHalfInterval;

  if (ratio < 0.8) {
    return "increasing"; // Failures becoming more frequent
  }
  if (ratio > 1.2) {
    return "decreasing"; // Failures becoming less frequent
  }
  return "stable";
}

/**
 * Count maintenance schedules approaching their due date
 */
export function countUpcomingMaintenance(
  schedules: MaintenanceSchedule[],
  daysThreshold = 7
): number {
  const now = Date.now();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

  return schedules.filter((schedule) => {
    if (!schedule.isActive || !schedule.nextDue) return false;
    const timeToDue = schedule.nextDue.getTime() - now;
    return timeToDue > 0 && timeToDue < thresholdMs;
  }).length;
}

/**
 * Count meter-based schedules approaching their intervals
 */
export function countApproachingMeterIntervals(
  schedules: MaintenanceSchedule[],
  currentReadings: Map<string, number>, // meterId -> current reading
  thresholdPercent = 90 // Trigger when 90% through interval
): number {
  return schedules.filter((schedule) => {
    if (!schedule.isActive || !schedule.meterId || !schedule.meterInterval) {
      return false;
    }

    const currentReading = currentReadings.get(schedule.meterId);
    if (currentReading === undefined) return false;

    const lastTrigger = Number.parseFloat(schedule.lastTriggerReading || "0");
    const progress = currentReading - lastTrigger;
    const progressPercent = (progress / schedule.meterInterval) * 100;

    return progressPercent >= thresholdPercent;
  }).length;
}

/**
 * Calculate failure probability
 *
 * Algorithm:
 * 1. Base probability from MTBF comparison
 * 2. Adjust for trend
 * 3. Adjust for upcoming maintenance needs
 * 4. Cap at 0.95 (never 100% certain)
 */
export function calculateFailureProbability(
  downtimeLogs: DowntimeLog[],
  schedules: MaintenanceSchedule[],
  currentMeterReadings: Map<string, number>,
  totalOperatingHours: number
): FailurePrediction {
  // Calculate factors
  const mtbf = calculateMTBF(downtimeLogs, totalOperatingHours);
  const timeSinceLastFailure = calculateTimeSinceLastFailure(downtimeLogs);
  const trend = analyzeDowntimeTrend(downtimeLogs);
  const upcomingMaintenance = countUpcomingMaintenance(schedules);
  const meterIntervalsApproaching = countApproachingMeterIntervals(
    schedules,
    currentMeterReadings
  );

  const factors: PredictionFactors = {
    mtbf,
    timeSinceLastFailure,
    upcomingMaintenanceCount: upcomingMaintenance,
    meterIntervalsApproaching,
    downtimeFrequencyTrend: trend,
  };

  // Base probability from MTBF
  let probability = 0;
  let confidence = 0.5;

  if (mtbf > 0 && timeSinceLastFailure > 0) {
    // Probability increases as we approach and exceed MTBF
    const mtbfRatio = timeSinceLastFailure / mtbf;

    if (mtbfRatio >= 1.5) {
      probability = 0.7; // Well past MTBF
    } else if (mtbfRatio >= 1.0) {
      probability = 0.4 + (mtbfRatio - 1.0) * 0.6; // At or past MTBF
    } else if (mtbfRatio >= 0.8) {
      probability = 0.2 + (mtbfRatio - 0.8) * 1.0; // Approaching MTBF
    } else {
      probability = mtbfRatio * 0.25; // Early in cycle
    }

    // More data = more confidence
    const failureCount = downtimeLogs.filter(
      (l) =>
        l.reasonCode === "mechanical_failure" ||
        l.reasonCode === "electrical_failure"
    ).length;
    confidence = Math.min(0.9, 0.3 + failureCount * 0.1);
  }

  // Adjust for trend
  if (trend === "increasing") {
    probability *= 1.3;
    confidence *= 0.9; // Less confident when trends are changing
  } else if (trend === "decreasing") {
    probability *= 0.7;
  }

  // Adjust for overdue maintenance
  if (upcomingMaintenance > 0) {
    probability += upcomingMaintenance * 0.05;
  }

  // Adjust for approaching meter intervals
  if (meterIntervalsApproaching > 0) {
    probability += meterIntervalsApproaching * 0.08;
  }

  // Cap probability
  probability = Math.min(0.95, Math.max(0, probability));

  // Estimate time to failure
  let estimatedTimeToFailure: number | null = null;
  if (mtbf > 0 && timeSinceLastFailure > 0) {
    const remaining = mtbf - timeSinceLastFailure;
    if (remaining > 0) {
      estimatedTimeToFailure = remaining;
    } else {
      // Already past MTBF, could fail anytime
      estimatedTimeToFailure = Math.max(1, mtbf * 0.1); // 10% of MTBF as buffer
    }
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (probability >= 0.7) {
    riskLevel = "critical";
  } else if (probability >= 0.5) {
    riskLevel = "high";
  } else if (probability >= 0.25) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  return {
    probability,
    confidence,
    estimatedTimeToFailure,
    factors,
    riskLevel,
  };
}
