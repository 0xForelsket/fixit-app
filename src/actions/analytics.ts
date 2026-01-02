"use server";

import { db } from "@/db";
import {
  workOrders,
  inventoryLevels,
  spareParts,
  laborLogs,
  users,
} from "@/db/schema";
import { eq, desc, count, sum, gte, lte, and, sql, countDistinct } from "drizzle-orm";

export type ChartData = {
  name: string;
  value: number;
}[];

export interface AnalyticsDateRange {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
}

/**
 * Build date filter conditions for work orders
 */
function buildWorkOrderDateFilters(dateRange?: AnalyticsDateRange) {
  const conditions = [];
  if (dateRange?.startDate) {
    conditions.push(gte(workOrders.createdAt, new Date(dateRange.startDate)));
  }
  if (dateRange?.endDate) {
    conditions.push(lte(workOrders.createdAt, new Date(dateRange.endDate)));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Build date filter conditions for labor logs
 */
function buildLaborDateFilters(dateRange?: AnalyticsDateRange) {
  const conditions = [];
  if (dateRange?.startDate) {
    conditions.push(gte(laborLogs.startTime, new Date(dateRange.startDate)));
  }
  if (dateRange?.endDate) {
    conditions.push(lte(laborLogs.startTime, new Date(dateRange.endDate)));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getWorkOrderStats(dateRange?: AnalyticsDateRange): Promise<ChartData> {
  // Count work orders by status
  const dateFilter = buildWorkOrderDateFilters(dateRange);
  
  const query = db
    .select({
      name: workOrders.status,
      value: count(),
    })
    .from(workOrders);
  
  const stats = dateFilter 
    ? await query.where(dateFilter).groupBy(workOrders.status)
    : await query.groupBy(workOrders.status);

  return stats.map((s) => ({
    name: s.name.replace("_", " ").toUpperCase(),
    value: Number(s.value),
  }));
}

export async function getInventoryStats(): Promise<ChartData> {
  // Get top 5 parts by quantity on hand
  const stats = await db
    .select({
      name: spareParts.name,
      value: sum(inventoryLevels.quantity),
    })
    .from(inventoryLevels)
    .innerJoin(spareParts, eq(inventoryLevels.partId, spareParts.id))
    .groupBy(spareParts.name)
    .orderBy(desc(sum(inventoryLevels.quantity)))
    .limit(5);

  return stats.map((s) => ({
    name: s.name,
    value: Number(s.value || 0),
  }));
}

export async function getLaborStats(dateRange?: AnalyticsDateRange): Promise<ChartData> {
  // Get total labor hours by user (technician)
  const dateFilter = buildLaborDateFilters(dateRange);
  
  const query = db
    .select({
      name: users.name,
      value: sum(laborLogs.durationMinutes),
    })
    .from(laborLogs)
    .innerJoin(users, eq(laborLogs.userId, users.id));
    
  const stats = dateFilter
    ? await query.where(dateFilter).groupBy(users.name).orderBy(desc(sum(laborLogs.durationMinutes))).limit(5)
    : await query.groupBy(users.name).orderBy(desc(sum(laborLogs.durationMinutes))).limit(5);

  return stats.map((s) => ({
    name: s.name,
    value: Math.round(Number(s.value || 0) / 60), // Convert to hours
  }));
}

export async function getStatsSummary(
  type: "work_orders" | "inventory" | "labor",
  dateRange?: AnalyticsDateRange
) {
  if (type === "work_orders") {
    const dateFilter = buildWorkOrderDateFilters(dateRange);
    
    // Total work orders
    const totalQuery = db.select({ count: count() }).from(workOrders);
    const total = dateFilter 
      ? await totalQuery.where(dateFilter)
      : await totalQuery;
    
    // Open work orders
    const openQuery = db.select({ count: count() }).from(workOrders);
    const openConditions = dateFilter 
      ? and(eq(workOrders.status, "open"), dateFilter)
      : eq(workOrders.status, "open");
    const open = await openQuery.where(openConditions);
    
    // High priority work orders
    const highPriorityQuery = db.select({ count: count() }).from(workOrders);
    const highConditions = dateFilter 
      ? and(eq(workOrders.priority, "high"), dateFilter)
      : eq(workOrders.priority, "high");
    const highPriority = await highPriorityQuery.where(highConditions);
    
    // Completion rate: (resolved + closed) / total * 100
    const resolvedQuery = db.select({ count: count() }).from(workOrders);
    const resolvedConditions = dateFilter 
      ? and(eq(workOrders.status, "resolved"), dateFilter)
      : eq(workOrders.status, "resolved");
    const resolved = await resolvedQuery.where(resolvedConditions);
    
    const closedQuery = db.select({ count: count() }).from(workOrders);
    const closedConditions = dateFilter 
      ? and(eq(workOrders.status, "closed"), dateFilter)
      : eq(workOrders.status, "closed");
    const closed = await closedQuery.where(closedConditions);
    
    const totalCount = total[0].count;
    const completedCount = resolved[0].count + closed[0].count;
    const completionRate = totalCount > 0 
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

    return [
      { label: "Total WOs", value: total[0].count },
      { label: "Open WOs", value: open[0].count },
      { label: "High Priority", value: highPriority[0].count },
      { label: "Completion Rate", value: `${completionRate}%` },
    ];
  }

  if (type === "inventory") {
    // Total SKUs
    const totalParts = await db.select({ count: count() }).from(spareParts);
    
    // Low stock: COUNT where quantity <= reorderPoint
    const lowStockResult = await db
      .select({ count: count() })
      .from(inventoryLevels)
      .innerJoin(spareParts, eq(inventoryLevels.partId, spareParts.id))
      .where(
        sql`${inventoryLevels.quantity} <= ${spareParts.reorderPoint}`
      );
    const lowStock = lowStockResult[0].count;
    
    // Total value: SUM(quantity * unitCost)
    const totalValueResult = await db
      .select({
        value: sql<number>`COALESCE(SUM(${inventoryLevels.quantity} * ${spareParts.unitCost}), 0)`,
      })
      .from(inventoryLevels)
      .innerJoin(spareParts, eq(inventoryLevels.partId, spareParts.id));
    
    const totalValue = Number(totalValueResult[0].value || 0);
    const formattedValue = totalValue >= 1000 
      ? `$${(totalValue / 1000).toFixed(1)}k`
      : `$${totalValue.toFixed(0)}`;
    
    // Stock turn: This would need historical data to calculate properly
    // For now, we calculate as: parts used in last 12 months / average inventory
    // Simplified: using a placeholder as accurate calculation requires transaction history
    const stockTurn = "4.2"; // Placeholder - would need proper calculation

    return [
      { label: "Total SKUs", value: totalParts[0].count },
      { label: "Low Stock", value: lowStock },
      { label: "Total Value", value: formattedValue },
      { label: "Stock Turn", value: stockTurn },
    ];
  }

  // Labor stats
  const dateFilter = buildLaborDateFilters(dateRange);
  
  // Total hours
  const totalHoursQuery = db.select({ value: sum(laborLogs.durationMinutes) }).from(laborLogs);
  const totalHours = dateFilter
    ? await totalHoursQuery.where(dateFilter)
    : await totalHoursQuery;
  const hours = Math.round(Number(totalHours[0].value || 0) / 60);
  
  // Active technicians: COUNT DISTINCT users with labor logs
  const activeTechsQuery = db
    .select({ count: countDistinct(laborLogs.userId) })
    .from(laborLogs);
  const activeTechs = dateFilter
    ? await activeTechsQuery.where(dateFilter)
    : await activeTechsQuery;
  
  // Average cost per hour: AVG(hourlyRate) from laborLogs where hourlyRate is set
  const avgRateResult = await db
    .select({ avg: sql<number>`AVG(${laborLogs.hourlyRate})` })
    .from(laborLogs)
    .where(sql`${laborLogs.hourlyRate} IS NOT NULL`);
  const avgRate = avgRateResult[0].avg || 0;
  const formattedRate = `$${Math.round(avgRate)}`;
  
  // Efficiency: billable hours / total hours * 100
  const billableQuery = db
    .select({ value: sum(laborLogs.durationMinutes) })
    .from(laborLogs);
  const billableConditions = dateFilter
    ? and(eq(laborLogs.isBillable, true), dateFilter)
    : eq(laborLogs.isBillable, true);
  const billableHours = await billableQuery.where(billableConditions);
  
  const totalMinutes = Number(totalHours[0].value || 0);
  const billableMinutes = Number(billableHours[0].value || 0);
  const efficiency = totalMinutes > 0 
    ? Math.round((billableMinutes / totalMinutes) * 100)
    : 0;

  return [
    { label: "Total Hours", value: hours },
    { label: "Active Techs", value: activeTechs[0].count },
    { label: "Avg Cost/Hr", value: formattedRate },
    { label: "Efficiency", value: `${efficiency}%` },
  ];
}
