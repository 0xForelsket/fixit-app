/**
 * Anomaly Detection for Meter Readings
 *
 * Detects abnormal readings using Simple Moving Average (SMA) and Standard Deviation.
 * Flags readings that deviate significantly from the expected value.
 */

import type { AnomalySeverity, AnomalyType, MeterReading } from "@/db/schema";

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyType?: AnomalyType;
  severity?: AnomalySeverity;
  expectedValue: number;
  actualValue: number;
  deviationPercent: number;
  movingAverage: number;
  standardDeviation: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateMovingAverage(readings: number[]): number {
  if (readings.length === 0) return 0;
  const sum = readings.reduce((acc, val) => acc + val, 0);
  return sum / readings.length;
}

/**
 * Calculate Standard Deviation
 */
export function calculateStandardDeviation(
  readings: number[],
  mean: number
): number {
  if (readings.length < 2) return 0;
  const squaredDiffs = readings.map((val) => (val - mean) ** 2);
  const avgSquaredDiff =
    squaredDiffs.reduce((acc, val) => acc + val, 0) / readings.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Determine anomaly type based on deviation direction
 */
export function determineAnomalyType(
  actual: number,
  expected: number,
  previousReadings: number[]
): AnomalyType {
  const diff = actual - expected;

  // Check for trend deviation (consistent upward or downward trend)
  if (previousReadings.length >= 3) {
    const recentTrend = previousReadings.slice(-3);
    const isUpwardTrend = recentTrend.every((val, i, arr) =>
      i === 0 ? true : val > arr[i - 1]
    );
    const isDownwardTrend = recentTrend.every((val, i, arr) =>
      i === 0 ? true : val < arr[i - 1]
    );

    if ((isUpwardTrend && diff < 0) || (isDownwardTrend && diff > 0)) {
      return "trend_deviation";
    }
  }

  // Simple spike or drop
  if (diff > 0) {
    return "spike";
  }
  return "drop";
}

/**
 * Determine severity based on standard deviation multiples
 * - 2-3 StdDev: low
 * - 3-4 StdDev: medium
 * - 4-5 StdDev: high
 * - >5 StdDev: critical
 */
export function determineSeverity(deviationMultiple: number): AnomalySeverity {
  if (deviationMultiple >= 5) return "critical";
  if (deviationMultiple >= 4) return "high";
  if (deviationMultiple >= 3) return "medium";
  return "low";
}

/**
 * Main anomaly detection function
 *
 * @param newReading - The new reading value to check
 * @param previousReadings - Array of previous MeterReading objects (most recent first)
 * @param minReadingsForDetection - Minimum readings needed for detection (default: 5)
 * @param stdDevThreshold - Number of standard deviations to trigger anomaly (default: 2)
 */
export function detectAnomaly(
  newReading: number,
  previousReadings: MeterReading[],
  minReadingsForDetection = 5,
  stdDevThreshold = 2
): AnomalyDetectionResult {
  // Convert readings to numbers
  const numericReadings = previousReadings
    .map((r) => Number.parseFloat(r.reading))
    .filter((v) => !Number.isNaN(v));

  // Not enough data for detection
  if (numericReadings.length < minReadingsForDetection) {
    return {
      isAnomaly: false,
      expectedValue: newReading,
      actualValue: newReading,
      deviationPercent: 0,
      movingAverage: newReading,
      standardDeviation: 0,
    };
  }

  // Calculate statistics
  const movingAverage = calculateMovingAverage(numericReadings);
  const standardDeviation = calculateStandardDeviation(
    numericReadings,
    movingAverage
  );

  // Handle zero or very small std dev (all readings are the same)
  if (standardDeviation < 0.001) {
    const isExact = Math.abs(newReading - movingAverage) < 0.001;
    return {
      isAnomaly: !isExact,
      anomalyType: isExact
        ? undefined
        : newReading > movingAverage
          ? "spike"
          : "drop",
      severity: isExact ? undefined : "medium",
      expectedValue: movingAverage,
      actualValue: newReading,
      deviationPercent: isExact ? 0 : 100,
      movingAverage,
      standardDeviation,
    };
  }

  // Calculate deviation
  const deviation = Math.abs(newReading - movingAverage);
  const deviationMultiple = deviation / standardDeviation;
  const deviationPercent =
    movingAverage !== 0
      ? (deviation / Math.abs(movingAverage)) * 100
      : deviation * 100;

  // Check if anomaly
  const isAnomaly = deviationMultiple >= stdDevThreshold;

  if (!isAnomaly) {
    return {
      isAnomaly: false,
      expectedValue: movingAverage,
      actualValue: newReading,
      deviationPercent,
      movingAverage,
      standardDeviation,
    };
  }

  // Determine type and severity
  const anomalyType = determineAnomalyType(
    newReading,
    movingAverage,
    numericReadings
  );
  const severity = determineSeverity(deviationMultiple);

  return {
    isAnomaly: true,
    anomalyType,
    severity,
    expectedValue: movingAverage,
    actualValue: newReading,
    deviationPercent,
    movingAverage,
    standardDeviation,
  };
}

/**
 * Check if a reading is out of range based on configured limits
 * (This would typically use meter-specific min/max settings)
 */
export function checkOutOfRange(
  reading: number,
  minValue?: number,
  maxValue?: number
): { isOutOfRange: boolean; severity: AnomalySeverity } {
  if (minValue !== undefined && reading < minValue) {
    const deviation = ((minValue - reading) / minValue) * 100;
    return {
      isOutOfRange: true,
      severity:
        deviation > 50 ? "critical" : deviation > 25 ? "high" : "medium",
    };
  }

  if (maxValue !== undefined && reading > maxValue) {
    const deviation = ((reading - maxValue) / maxValue) * 100;
    return {
      isOutOfRange: true,
      severity:
        deviation > 50 ? "critical" : deviation > 25 ? "high" : "medium",
    };
  }

  return { isOutOfRange: false, severity: "low" };
}
