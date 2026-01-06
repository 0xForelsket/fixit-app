"use server";

import { db } from "@/db";
import {
  equipmentMeters,
  equipmentPredictions,
  meterAnomalies,
  meterReadings,
  workOrders,
} from "@/db/schema";
import { detectAnomaly } from "@/lib/analytics/anomaly-detection";
import { calculateFailureProbability } from "@/lib/analytics/predictions";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ============ PREDICTIONS ============

/**
 * Get active (unacknowledged) predictions for an equipment
 */
export async function getEquipmentPredictions(equipmentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const predictions = await db.query.equipmentPredictions.findMany({
      where: and(
        eq(equipmentPredictions.equipmentId, equipmentId),
        eq(equipmentPredictions.isAcknowledged, false)
      ),
      orderBy: [desc(equipmentPredictions.createdAt)],
    });

    return { success: true, data: predictions };
  } catch (_error) {
    return { success: false, error: "Failed to fetch predictions" };
  }
}

/**
 * Generate or update failure prediction for equipment
 */
export async function generatePrediction(equipmentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Get equipment with meters
    const eqResult = await db.query.equipment.findFirst({
      where: (e, { eq }) => eq(e.id, equipmentId),
    });

    if (!eqResult) {
      return { success: false, error: "Equipment not found" };
    }

    // Get downtime logs for this equipment
    const logs = await db.query.downtimeLogs.findMany({
      where: (dl, { eq }) => eq(dl.equipmentId, equipmentId),
    });

    // Get maintenance schedules
    const schedules = await db.query.maintenanceSchedules.findMany({
      where: (ms, { eq }) => eq(ms.equipmentId, equipmentId),
    });

    // Get current meter readings
    const meters = await db.query.equipmentMeters.findMany({
      where: (em, { eq }) => eq(em.equipmentId, equipmentId),
    });

    const currentReadings = new Map<string, number>();
    for (const meter of meters) {
      if (meter.currentReading) {
        currentReadings.set(meter.id, Number.parseFloat(meter.currentReading));
      }
    }

    // Calculate operating hours (simplified: assume 24/7 since purchase or 1 year)
    const purchaseDate =
      eqResult.purchaseDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const operatingHours =
      (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60);

    // Calculate prediction
    const prediction = calculateFailureProbability(
      logs,
      schedules,
      currentReadings,
      operatingHours
    );

    // Store prediction
    const [newPrediction] = await db
      .insert(equipmentPredictions)
      .values({
        equipmentId,
        predictionType: "failure",
        probability: prediction.probability.toFixed(4),
        estimatedDate: prediction.estimatedTimeToFailure
          ? new Date(
              Date.now() + prediction.estimatedTimeToFailure * 60 * 60 * 1000
            )
          : null,
        confidence: prediction.confidence.toFixed(4),
        factors: JSON.stringify(prediction.factors),
      })
      .returning();

    revalidatePath(`/assets/equipment/${eqResult.code}`);

    return { success: true, data: newPrediction, prediction };
  } catch (error) {
    console.error("Error generating prediction:", error);
    return { success: false, error: "Failed to generate prediction" };
  }
}

/**
 * Acknowledge a prediction (dismiss it)
 */
export async function acknowledgePrediction(predictionId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    await db
      .update(equipmentPredictions)
      .set({
        isAcknowledged: true,
        acknowledgedById: user.id,
        acknowledgedAt: new Date(),
      })
      .where(eq(equipmentPredictions.id, predictionId));

    revalidatePath("/assets/equipment");
    return { success: true };
  } catch (_error) {
    return { success: false, error: "Failed to acknowledge prediction" };
  }
}

// ============ ANOMALIES ============

/**
 * Get unresolved anomalies for a meter
 */
export async function getMeterAnomalies(meterId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const anomalies = await db.query.meterAnomalies.findMany({
      where: and(
        eq(meterAnomalies.meterId, meterId),
        eq(meterAnomalies.isResolved, false)
      ),
      with: {
        reading: true,
        workOrder: true,
      },
      orderBy: [desc(meterAnomalies.createdAt)],
    });

    return { success: true, data: anomalies };
  } catch (_error) {
    return { success: false, error: "Failed to fetch anomalies" };
  }
}

/**
 * Get all unresolved anomalies for an equipment's meters
 */
export async function getEquipmentAnomalies(equipmentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Get meters for this equipment
    const meters = await db.query.equipmentMeters.findMany({
      where: eq(equipmentMeters.equipmentId, equipmentId),
    });

    const meterIds = meters.map((m) => m.id);

    if (meterIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get anomalies for all meters
    const anomalies = await db.query.meterAnomalies.findMany({
      where: eq(meterAnomalies.isResolved, false),
      with: {
        meter: true,
        reading: true,
        workOrder: true,
      },
      orderBy: [desc(meterAnomalies.createdAt)],
    });

    // Filter to only this equipment's meters
    const filtered = anomalies.filter((a) => meterIds.includes(a.meterId));

    return { success: true, data: filtered };
  } catch (_error) {
    return { success: false, error: "Failed to fetch anomalies" };
  }
}

/**
 * Check a new reading for anomalies and create records if detected
 * Called from recordReading action
 */
export async function checkAndRecordAnomaly(
  meterId: string,
  readingId: string,
  newReading: number,
  userId: string
) {
  try {
    // Get previous readings
    const previousReadings = await db.query.meterReadings.findMany({
      where: eq(meterReadings.meterId, meterId),
      orderBy: [desc(meterReadings.recordedAt)],
      limit: 15, // Get more than needed for good statistics
    });

    // Exclude the just-recorded reading
    const historicReadings = previousReadings.filter((r) => r.id !== readingId);

    // Detect anomaly
    const result = detectAnomaly(newReading, historicReadings);

    if (!result.isAnomaly || !result.anomalyType || !result.severity) {
      return { isAnomaly: false };
    }

    // Get meter to find equipment
    const meter = await db.query.equipmentMeters.findFirst({
      where: eq(equipmentMeters.id, meterId),
      with: {
        equipment: true,
      },
    });

    let workOrderId: string | null = null;

    // Auto-generate work order for high/critical severity
    if (result.severity === "high" || result.severity === "critical") {
      // Only create work order if we have valid equipment
      if (meter?.equipmentId) {
        const [wo] = await db
          .insert(workOrders)
          .values({
            title: `Anomaly Detected: ${meter.name || "Meter"} reading abnormal`,
            description: `Automatic inspection requested due to ${result.anomalyType} anomaly.
Expected: ${result.expectedValue.toFixed(2)}
Actual: ${newReading}
Deviation: ${result.deviationPercent.toFixed(1)}%`,
            equipmentId: meter.equipmentId,
            type: "maintenance",
            priority: result.severity === "critical" ? "critical" : "high",
            reportedById: userId,
            dueBy: calculateDueBy(
              result.severity === "critical" ? "critical" : "high"
            ),
            departmentId: meter.equipment?.departmentId || null,
          })
          .returning();

        workOrderId = wo.id;
      }
    }

    // Create anomaly record
    await db.insert(meterAnomalies).values({
      meterId,
      readingId,
      anomalyType: result.anomalyType,
      severity: result.severity,
      expectedValue: result.expectedValue.toFixed(4),
      actualValue: newReading.toFixed(4),
      deviationPercent: result.deviationPercent.toFixed(2),
      workOrderId,
    });

    if (meter?.equipment?.code) {
      revalidatePath(`/assets/equipment/${meter.equipment.code}`);
    }
    revalidatePath("/maintenance/work-orders");

    return {
      isAnomaly: true,
      anomalyType: result.anomalyType,
      severity: result.severity,
      workOrderCreated: !!workOrderId,
    };
  } catch (error) {
    console.error("Error checking for anomaly:", error);
    return { isAnomaly: false, error: "Failed to check for anomaly" };
  }
}

/**
 * Resolve an anomaly
 */
export async function resolveAnomaly(anomalyId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    await db
      .update(meterAnomalies)
      .set({
        isResolved: true,
        resolvedById: user.id,
        resolvedAt: new Date(),
      })
      .where(eq(meterAnomalies.id, anomalyId));

    revalidatePath("/assets/equipment");
    return { success: true };
  } catch (_error) {
    return { success: false, error: "Failed to resolve anomaly" };
  }
}
