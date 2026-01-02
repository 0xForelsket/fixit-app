"use server";

import { db } from "@/db";
import { 
  workOrders, 
  inventoryLevels, 
  spareParts, 
  laborLogs, 
  users 
} from "@/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";

export type ChartData = {
  name: string;
  value: number;
}[];

export async function getWorkOrderStats(): Promise<ChartData> {
  // Count work orders by status
  const stats = await db
    .select({
      name: workOrders.status,
      value: count(),
    })
    .from(workOrders)
    .groupBy(workOrders.status);

  return stats.map(s => ({ 
    name: s.name.replace("_", " ").toUpperCase(), 
    value: Number(s.value) 
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

  return stats.map(s => ({
    name: s.name,
    value: Number(s.value || 0),
  }));
}

export async function getLaborStats(): Promise<ChartData> {
  // Get total labor hours by user (technician)
  const stats = await db
    .select({
      name: users.name,
      value: sum(laborLogs.durationMinutes),
    })
    .from(laborLogs)
    .innerJoin(users, eq(laborLogs.userId, users.id))
    .groupBy(users.name)
    .orderBy(desc(sum(laborLogs.durationMinutes)))
    .limit(5);

  return stats.map(s => ({
    name: s.name,
    value: Math.round(Number(s.value || 0) / 60), // Convert to hours
  }));
}

export async function getStatsSummary(type: "work_orders" | "inventory" | "labor") {
  if (type === "work_orders") {
    const total = await db.select({ count: count() }).from(workOrders);
    const open = await db.select({ count: count() }).from(workOrders).where(eq(workOrders.status, "open"));
    const highPriority = await db.select({ count: count() }).from(workOrders).where(eq(workOrders.priority, "high"));
    
    return [
      { label: "Total WOs", value: total[0].count },
      { label: "Open WOs", value: open[0].count },
      { label: "High Priority", value: highPriority[0].count },
      { label: "Completion Rate", value: "85%" }, // Mock for now
    ];
  }
  
  if (type === "inventory") {
    const totalParts = await db.select({ count: count() }).from(spareParts);
    // Rough estimate of low stock (this is expensive in real world without denormalization)
    const lowStock = 5; // Placeholder
    
    return [
      { label: "Total SKUs", value: totalParts[0].count },
      { label: "Low Stock", value: lowStock },
      { label: "Total Value", value: "$45k" }, // Placeholder
      { label: "Stock Turn", value: "4.2" },
    ];
  }

  // Labor
  const totalHours = await db.select({ value: sum(laborLogs.durationMinutes) }).from(laborLogs);
  const hours = Math.round(Number(totalHours[0].value || 0) / 60);
  
  return [
    { label: "Total Hours", value: hours },
    { label: "Active Techs", value: 4 },
    { label: "Avg Cost/Hr", value: "$45" },
    { label: "Efficiency", value: "92%" },
  ];
}
