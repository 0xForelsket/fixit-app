"use server";

import { db } from "@/db";
import {
  departments,
  equipment,
  laborLogs,
  spareParts,
  users,
  workOrderParts,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

// Types for cost summary data
export interface CostByEquipment {
  id: number;
  name: string;
  code: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  workOrderCount: number;
}

export interface CostByDepartment {
  id: number;
  name: string;
  code: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
}

export interface CostByMonth {
  month: string; // YYYY-MM format
  laborCost: number;
  partsCost: number;
  totalCost: number;
}

export interface TopCostlyWorkOrder {
  id: number;
  title: string;
  equipmentName: string;
  equipmentCode: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  status: string;
  createdAt: Date;
}

export interface CostSummary {
  totalLaborCost: number;
  totalPartsCost: number;
  totalCost: number;
  averageCostPerWorkOrder: number;
  workOrderCount: number;
  costByEquipment: CostByEquipment[];
  costByDepartment: CostByDepartment[];
  costByMonth: CostByMonth[];
  topCostlyWorkOrders: TopCostlyWorkOrder[];
}

export interface CostFilters {
  startDate?: Date;
  endDate?: Date;
  equipmentId?: number;
  departmentId?: number;
}

export async function getCostSummary(
  filters?: CostFilters
): Promise<ActionResult<CostSummary>> {
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
    // Build date filter conditions
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(gte(workOrders.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      dateConditions.push(lte(workOrders.createdAt, filters.endDate));
    }

    // Build work order filter conditions
    const woConditions = [...dateConditions];
    if (filters?.equipmentId) {
      woConditions.push(eq(workOrders.equipmentId, filters.equipmentId));
    }
    if (filters?.departmentId) {
      woConditions.push(eq(workOrders.departmentId, filters.departmentId));
    }

    // Get all work orders matching filters
    const filteredWorkOrders = await db
      .select({
        id: workOrders.id,
        title: workOrders.title,
        status: workOrders.status,
        createdAt: workOrders.createdAt,
        equipmentId: workOrders.equipmentId,
        departmentId: workOrders.departmentId,
      })
      .from(workOrders)
      .where(woConditions.length > 0 ? and(...woConditions) : undefined);

    const workOrderIds = filteredWorkOrders.map((wo) => wo.id);

    if (workOrderIds.length === 0) {
      return {
        success: true,
        data: {
          totalLaborCost: 0,
          totalPartsCost: 0,
          totalCost: 0,
          averageCostPerWorkOrder: 0,
          workOrderCount: 0,
          costByEquipment: [],
          costByDepartment: [],
          costByMonth: [],
          topCostlyWorkOrders: [],
        },
      };
    }

    // Calculate labor costs from laborLogs
    // Labor cost = durationMinutes / 60 * hourlyRate (use labor log hourlyRate or fall back to user's default)
    const laborData = await db
      .select({
        workOrderId: laborLogs.workOrderId,
        durationMinutes: laborLogs.durationMinutes,
        hourlyRate: laborLogs.hourlyRate,
        userHourlyRate: users.hourlyRate,
      })
      .from(laborLogs)
      .leftJoin(users, eq(laborLogs.userId, users.id))
      .where(
        sql`${laborLogs.workOrderId} IN (${sql.join(
          workOrderIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    // Calculate parts costs from workOrderParts
    // Parts cost = quantity * unitCost (use work order part unitCost or fall back to spare part's default)
    const partsData = await db
      .select({
        workOrderId: workOrderParts.workOrderId,
        quantity: workOrderParts.quantity,
        unitCost: workOrderParts.unitCost,
        partUnitCost: spareParts.unitCost,
      })
      .from(workOrderParts)
      .leftJoin(spareParts, eq(workOrderParts.partId, spareParts.id))
      .where(
        sql`${workOrderParts.workOrderId} IN (${sql.join(
          workOrderIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    // Build cost maps by work order
    const laborCostByWO = new Map<number, number>();
    for (const row of laborData) {
      if (row.workOrderId && row.durationMinutes) {
        const rate = row.hourlyRate ?? row.userHourlyRate ?? 0;
        const cost = (row.durationMinutes / 60) * rate;
        laborCostByWO.set(
          row.workOrderId,
          (laborCostByWO.get(row.workOrderId) || 0) + cost
        );
      }
    }

    const partsCostByWO = new Map<number, number>();
    for (const row of partsData) {
      if (row.workOrderId && row.quantity) {
        const cost = row.quantity * (row.unitCost ?? row.partUnitCost ?? 0);
        partsCostByWO.set(
          row.workOrderId,
          (partsCostByWO.get(row.workOrderId) || 0) + cost
        );
      }
    }

    // Calculate totals
    let totalLaborCost = 0;
    let totalPartsCost = 0;

    for (const cost of laborCostByWO.values()) {
      totalLaborCost += cost;
    }
    for (const cost of partsCostByWO.values()) {
      totalPartsCost += cost;
    }

    const totalCost = totalLaborCost + totalPartsCost;
    const workOrderCount = filteredWorkOrders.length;
    const averageCostPerWorkOrder =
      workOrderCount > 0 ? totalCost / workOrderCount : 0;

    // Get equipment info for cost by equipment
    const equipmentData = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
      })
      .from(equipment);

    const equipmentMap = new Map(equipmentData.map((e) => [e.id, e]));

    // Build cost by equipment
    const equipmentCostMap = new Map<
      number,
      { labor: number; parts: number; count: number }
    >();
    for (const wo of filteredWorkOrders) {
      if (!equipmentCostMap.has(wo.equipmentId)) {
        equipmentCostMap.set(wo.equipmentId, { labor: 0, parts: 0, count: 0 });
      }
      const data = equipmentCostMap.get(wo.equipmentId)!;
      data.labor += laborCostByWO.get(wo.id) || 0;
      data.parts += partsCostByWO.get(wo.id) || 0;
      data.count += 1;
    }

    const costByEquipment: CostByEquipment[] = Array.from(
      equipmentCostMap.entries()
    )
      .map(([eqId, costs]) => {
        const eq = equipmentMap.get(eqId);
        return {
          id: eqId,
          name: eq?.name || "Unknown",
          code: eq?.code || "",
          laborCost: costs.labor,
          partsCost: costs.parts,
          totalCost: costs.labor + costs.parts,
          workOrderCount: costs.count,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    // Get department info for cost by department
    const departmentData = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments);

    const departmentMap = new Map(departmentData.map((d) => [d.id, d]));

    // Build cost by department
    const departmentCostMap = new Map<number, { labor: number; parts: number }>();
    for (const wo of filteredWorkOrders) {
      if (wo.departmentId) {
        if (!departmentCostMap.has(wo.departmentId)) {
          departmentCostMap.set(wo.departmentId, { labor: 0, parts: 0 });
        }
        const data = departmentCostMap.get(wo.departmentId)!;
        data.labor += laborCostByWO.get(wo.id) || 0;
        data.parts += partsCostByWO.get(wo.id) || 0;
      }
    }

    const costByDepartment: CostByDepartment[] = Array.from(
      departmentCostMap.entries()
    )
      .map(([deptId, costs]) => {
        const dept = departmentMap.get(deptId);
        return {
          id: deptId,
          name: dept?.name || "Unknown",
          code: dept?.code || "",
          laborCost: costs.labor,
          partsCost: costs.parts,
          totalCost: costs.labor + costs.parts,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost);

    // Build cost by month
    const monthCostMap = new Map<string, { labor: number; parts: number }>();
    for (const wo of filteredWorkOrders) {
      const date = wo.createdAt;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthCostMap.has(monthKey)) {
        monthCostMap.set(monthKey, { labor: 0, parts: 0 });
      }
      const data = monthCostMap.get(monthKey)!;
      data.labor += laborCostByWO.get(wo.id) || 0;
      data.parts += partsCostByWO.get(wo.id) || 0;
    }

    const costByMonth: CostByMonth[] = Array.from(monthCostMap.entries())
      .map(([month, costs]) => ({
        month,
        laborCost: costs.labor,
        partsCost: costs.parts,
        totalCost: costs.labor + costs.parts,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Build top costly work orders
    const workOrderCosts = filteredWorkOrders.map((wo) => {
      const eq = equipmentMap.get(wo.equipmentId);
      const laborCost = laborCostByWO.get(wo.id) || 0;
      const partsCost = partsCostByWO.get(wo.id) || 0;
      return {
        id: wo.id,
        title: wo.title,
        equipmentName: eq?.name || "Unknown",
        equipmentCode: eq?.code || "",
        laborCost,
        partsCost,
        totalCost: laborCost + partsCost,
        status: wo.status,
        createdAt: wo.createdAt,
      };
    });

    const topCostlyWorkOrders = workOrderCosts
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    return {
      success: true,
      data: {
        totalLaborCost,
        totalPartsCost,
        totalCost,
        averageCostPerWorkOrder,
        workOrderCount,
        costByEquipment,
        costByDepartment,
        costByMonth,
        topCostlyWorkOrders,
      },
    };
  } catch (error) {
    console.error("Failed to get cost summary:", error);
    return {
      success: false,
      error: "Failed to fetch cost data. Please try again.",
    };
  }
}

// Helper function to get equipment list for filter dropdown
export async function getEquipmentForFilter(): Promise<
  ActionResult<Array<{ id: number; name: string; code: string }>>
> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const result = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
      })
      .from(equipment)
      .orderBy(equipment.name);

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get equipment list:", error);
    return { success: false, error: "Failed to fetch equipment list" };
  }
}

// Helper function to get department list for filter dropdown
export async function getDepartmentsForFilter(): Promise<
  ActionResult<Array<{ id: number; name: string; code: string }>>
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
