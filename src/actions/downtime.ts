"use server";

import { db } from "@/db";
import {
  departments,
  equipment,
  equipmentStatusLogs,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

// Types for downtime summary data
export interface DowntimeByEquipment {
  id: string;
  name: string;
  code: string;
  downtimeHours: number;
  incidentCount: number;
}

export interface DowntimeByReason {
  reason: string;
  downtimeHours: number;
  incidentCount: number;
  percentage: number;
}

export interface DowntimeByMonth {
  month: string; // YYYY-MM format
  downtimeHours: number;
  incidentCount: number;
}

export interface RecentDowntimeEvent {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  startTime: Date;
  endTime: Date | null;
  downtimeHours: number;
  workOrderId: string | null;
  workOrderTitle: string | null;
  workOrderType: string | null;
}

export interface DowntimeSummary {
  totalDowntimeHours: number;
  availabilityPercentage: number;
  incidentCount: number;
  averageDowntimePerIncident: number;
  downtimeByEquipment: DowntimeByEquipment[];
  downtimeByReason: DowntimeByReason[];
  downtimeByMonth: DowntimeByMonth[];
  recentDowntimeEvents: RecentDowntimeEvent[];
}

export interface DowntimeFilters {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
}

// Helper to calculate downtime duration between two dates
function calculateDowntimeHours(startTime: Date, endTime: Date | null): number {
  const end = endTime || new Date();
  const diffMs = end.getTime() - startTime.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
}

export async function getDowntimeSummary(
  filters?: DowntimeFilters
): Promise<ActionResult<DowntimeSummary>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return {
      success: false,
      error: "You don't have permission to view analytics",
    };
  }

  try {
    // Build date filter conditions for status logs
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(
        gte(equipmentStatusLogs.changedAt, filters.startDate)
      );
    }
    if (filters?.endDate) {
      dateConditions.push(lte(equipmentStatusLogs.changedAt, filters.endDate));
    }

    // Get all equipment (optionally filtered by department)
    const equipmentConditions = [];
    if (filters?.departmentId) {
      equipmentConditions.push(
        eq(equipment.departmentId, filters.departmentId)
      );
    }

    const allEquipment = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
        departmentId: equipment.departmentId,
      })
      .from(equipment)
      .where(
        equipmentConditions.length > 0 ? and(...equipmentConditions) : undefined
      );

    const equipmentIds = allEquipment.map((e) => e.id);
    const equipmentMap = new Map(allEquipment.map((e) => [e.id, e]));

    if (equipmentIds.length === 0) {
      return {
        success: true,
        data: {
          totalDowntimeHours: 0,
          availabilityPercentage: 100,
          incidentCount: 0,
          averageDowntimePerIncident: 0,
          downtimeByEquipment: [],
          downtimeByReason: [],
          downtimeByMonth: [],
          recentDowntimeEvents: [],
        },
      };
    }

    // Get all status logs for transitions to/from "down"
    // We need logs where newStatus = 'down' (start of downtime)
    // and oldStatus = 'down' (end of downtime)
    const statusLogs = await db
      .select({
        id: equipmentStatusLogs.id,
        equipmentId: equipmentStatusLogs.equipmentId,
        oldStatus: equipmentStatusLogs.oldStatus,
        newStatus: equipmentStatusLogs.newStatus,
        changedAt: equipmentStatusLogs.changedAt,
      })
      .from(equipmentStatusLogs)
      .where(
        and(
          sql`${equipmentStatusLogs.equipmentId} IN (${sql.join(
            equipmentIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      )
      .orderBy(equipmentStatusLogs.equipmentId, equipmentStatusLogs.changedAt);

    // Calculate downtime periods
    // A downtime period starts when status changes TO "down"
    // and ends when status changes FROM "down"
    interface DowntimePeriod {
      equipmentId: string;
      startTime: Date;
      endTime: Date | null;
      downtimeHours: number;
    }

    const downtimePeriods: DowntimePeriod[] = [];
    const currentDowntime = new Map<string, Date>(); // equipmentId -> startTime

    // Sort logs by equipment and time
    const sortedLogs = [...statusLogs].sort((a, b) => {
      if (a.equipmentId !== b.equipmentId) return a.equipmentId.localeCompare(b.equipmentId);
      return a.changedAt.getTime() - b.changedAt.getTime();
    });

    for (const log of sortedLogs) {
      if (log.newStatus === "down" && log.oldStatus !== "down") {
        // Start of downtime
        currentDowntime.set(log.equipmentId, log.changedAt);
      } else if (log.oldStatus === "down" && log.newStatus !== "down") {
        // End of downtime
        const startTime = currentDowntime.get(log.equipmentId);
        if (startTime) {
          downtimePeriods.push({
            equipmentId: log.equipmentId,
            startTime,
            endTime: log.changedAt,
            downtimeHours: calculateDowntimeHours(startTime, log.changedAt),
          });
          currentDowntime.delete(log.equipmentId);
        }
      }
    }

    // Handle ongoing downtime (equipment still down)
    const filterEndDate = filters?.endDate || new Date();
    for (const [equipmentId, startTime] of currentDowntime) {
      downtimePeriods.push({
        equipmentId,
        startTime,
        endTime: null,
        downtimeHours: calculateDowntimeHours(startTime, filterEndDate),
      });
    }

    // Calculate total downtime and availability
    const totalDowntimeHours = downtimePeriods.reduce(
      (sum, p) => sum + p.downtimeHours,
      0
    );
    const incidentCount = downtimePeriods.length;

    // Calculate availability: (total possible time - downtime) / total possible time * 100
    const startDate =
      filters?.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Default 1 year
    const endDate = filters?.endDate || new Date();
    const totalPossibleHours =
      ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)) *
      equipmentIds.length;
    const availabilityPercentage =
      totalPossibleHours > 0
        ? Math.max(
            0,
            Math.min(
              100,
              ((totalPossibleHours - totalDowntimeHours) / totalPossibleHours) *
                100
            )
          )
        : 100;

    const averageDowntimePerIncident =
      incidentCount > 0 ? totalDowntimeHours / incidentCount : 0;

    // Calculate downtime by equipment (top 5)
    const equipmentDowntimeMap = new Map<
      string,
      { hours: number; count: number }
    >();
    for (const period of downtimePeriods) {
      const existing = equipmentDowntimeMap.get(period.equipmentId) || {
        hours: 0,
        count: 0,
      };
      equipmentDowntimeMap.set(period.equipmentId, {
        hours: existing.hours + period.downtimeHours,
        count: existing.count + 1,
      });
    }

    const downtimeByEquipment: DowntimeByEquipment[] = Array.from(
      equipmentDowntimeMap.entries()
    )
      .map(([eqId, data]) => {
        const eq = equipmentMap.get(eqId);
        return {
          id: eqId,
          name: eq?.name || "Unknown",
          code: eq?.code || "",
          downtimeHours: data.hours,
          incidentCount: data.count,
        };
      })
      .sort((a, b) => b.downtimeHours - a.downtimeHours)
      .slice(0, 5);

    // Get work orders associated with downtime periods to determine reasons
    // We'll look for breakdown work orders created around the downtime start
    const workOrderData = await db
      .select({
        id: workOrders.id,
        equipmentId: workOrders.equipmentId,
        type: workOrders.type,
        title: workOrders.title,
        createdAt: workOrders.createdAt,
      })
      .from(workOrders)
      .where(
        and(
          sql`${workOrders.equipmentId} IN (${sql.join(
            equipmentIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          filters?.startDate
            ? gte(workOrders.createdAt, filters.startDate)
            : undefined,
          filters?.endDate
            ? lte(workOrders.createdAt, filters.endDate)
            : undefined
        )
      )
      .orderBy(desc(workOrders.createdAt));

    // Map downtime periods to work orders/reasons
    const reasonMap = new Map<string, { hours: number; count: number }>();
    const periodWorkOrders = new Map<
      string,
      { workOrderId: string; title: string; type: string }
    >();

    for (const period of downtimePeriods) {
      // Find work order created close to downtime start (within 1 hour before or after)
      const matchingWO = workOrderData.find(
        (wo) =>
          wo.equipmentId === period.equipmentId &&
          Math.abs(wo.createdAt.getTime() - period.startTime.getTime()) <
            60 * 60 * 1000 // Within 1 hour
      );

      const reason = matchingWO?.type || "unspecified";
      const existing = reasonMap.get(reason) || { hours: 0, count: 0 };
      reasonMap.set(reason, {
        hours: existing.hours + period.downtimeHours,
        count: existing.count + 1,
      });

      if (matchingWO) {
        // Store for recent events table using a unique key
        const periodKey = `${period.equipmentId}-${period.startTime.getTime()}`;
        periodWorkOrders.set(periodKey, {
          workOrderId: matchingWO.id,
          title: matchingWO.title,
          type: matchingWO.type,
        });
      }
    }

    // Build downtime by reason
    const downtimeByReason: DowntimeByReason[] = Array.from(reasonMap.entries())
      .map(([reason, data]) => ({
        reason: formatReasonLabel(reason),
        downtimeHours: data.hours,
        incidentCount: data.count,
        percentage:
          totalDowntimeHours > 0 ? (data.hours / totalDowntimeHours) * 100 : 0,
      }))
      .sort((a, b) => b.downtimeHours - a.downtimeHours);

    // Build downtime by month
    const monthMap = new Map<string, { hours: number; count: number }>();
    for (const period of downtimePeriods) {
      const date = period.startTime;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthMap.get(monthKey) || { hours: 0, count: 0 };
      monthMap.set(monthKey, {
        hours: existing.hours + period.downtimeHours,
        count: existing.count + 1,
      });
    }

    const downtimeByMonth: DowntimeByMonth[] = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        downtimeHours: data.hours,
        incidentCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Build recent downtime events (last 10)
    const recentPeriods = [...downtimePeriods]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    const recentDowntimeEvents: RecentDowntimeEvent[] = recentPeriods.map(
      (period, index) => {
        const eq = equipmentMap.get(period.equipmentId);
        // Find matching work order
        const matchingWO = workOrderData.find(
          (wo) =>
            wo.equipmentId === period.equipmentId &&
            Math.abs(wo.createdAt.getTime() - period.startTime.getTime()) <
              60 * 60 * 1000
        );

        return {
          id: `downtime-${index + 1}`,
          equipmentId: period.equipmentId,
          equipmentName: eq?.name || "Unknown",
          equipmentCode: eq?.code || "",
          startTime: period.startTime,
          endTime: period.endTime,
          downtimeHours: period.downtimeHours,
          workOrderId: matchingWO?.id || null,
          workOrderTitle: matchingWO?.title || null,
          workOrderType: matchingWO?.type || null,
        };
      }
    );

    return {
      success: true,
      data: {
        totalDowntimeHours,
        availabilityPercentage,
        incidentCount,
        averageDowntimePerIncident,
        downtimeByEquipment,
        downtimeByReason,
        downtimeByMonth,
        recentDowntimeEvents,
      },
    };
  } catch (error) {
    console.error("Failed to get downtime summary:", error);
    return {
      success: false,
      error: "Failed to fetch downtime data. Please try again.",
    };
  }
}

// Format reason labels for display
function formatReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    breakdown: "Breakdown",
    maintenance: "Maintenance",
    calibration: "Calibration",
    safety: "Safety",
    upgrade: "Upgrade",
    unspecified: "Unspecified",
  };
  return labels[reason] || reason;
}

// Helper function to get department list for filter dropdown
export async function getDepartmentsForDowntimeFilter(): Promise<
  ActionResult<Array<{ id: string; name: string; code: string }>>
> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const result = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(departments.name);

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get department list:", error);
    return { success: false, error: "Failed to fetch department list" };
  }
}
