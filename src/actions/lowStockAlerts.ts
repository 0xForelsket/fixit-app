"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createNotificationsForUsers } from "@/lib/notifications";
import { PERMISSIONS } from "@/lib/permissions";
import { and, eq, inArray } from "drizzle-orm";

interface LowStockItem {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  locationName: string;
  quantity: number;
  reorderPoint: number;
}

/**
 * Checks for low stock items and sends notifications to users with inventory permissions.
 * Returns the number of low stock items found and notifications sent.
 */
export async function checkAndNotifyLowStock(): Promise<{
  lowStockCount: number;
  notificationsSent: number;
  items: LowStockItem[];
}> {
  // Get all inventory levels with their parts and locations
  const levels = await db.query.inventoryLevels.findMany({
    with: {
      part: true,
      location: true,
    },
  });

  // Filter to find items below reorder point
  const lowStockItems: LowStockItem[] = levels
    .filter((level) => {
      if (!level.part || !level.part.isActive) return false;
      return level.quantity <= level.part.reorderPoint;
    })
    .map((level) => ({
      id: level.id,
      partId: level.partId,
      partName: level.part!.name,
      partSku: level.part!.sku,
      locationName: level.location?.name || "Unknown",
      quantity: level.quantity,
      reorderPoint: level.part!.reorderPoint,
    }));

  if (lowStockItems.length === 0) {
    return { lowStockCount: 0, notificationsSent: 0, items: [] };
  }

  // Find users who have inventory view or receive stock permissions
  // Get roles with inventory permissions
  const allRoles = await db.query.roles.findMany();
  const inventoryRoles = allRoles.filter((role) => {
    return (
      role.permissions.includes("*") ||
      role.permissions.includes(PERMISSIONS.INVENTORY_VIEW) ||
      role.permissions.includes(PERMISSIONS.INVENTORY_RECEIVE_STOCK)
    );
  });

  if (inventoryRoles.length === 0) {
    return {
      lowStockCount: lowStockItems.length,
      notificationsSent: 0,
      items: lowStockItems,
    };
  }

  // Get active users with these roles
  const inventoryUsers = await db.query.users.findMany({
    where: and(
      inArray(
        users.roleId,
        inventoryRoles.map((r) => r.id)
      ),
      eq(users.isActive, true)
    ),
    columns: { id: true },
  });

  if (inventoryUsers.length === 0) {
    return {
      lowStockCount: lowStockItems.length,
      notificationsSent: 0,
      items: lowStockItems,
    };
  }

  const userIds = inventoryUsers.map((u) => u.id);

  // Create a summary notification
  const criticalCount = lowStockItems.filter(
    (item) => item.quantity === 0
  ).length;
  const title =
    criticalCount > 0
      ? `🚨 ${criticalCount} item(s) out of stock!`
      : `⚠️ ${lowStockItems.length} item(s) below reorder point`;

  const itemsSummary = lowStockItems
    .slice(0, 3)
    .map((item) => `• ${item.partName}: ${item.quantity}/${item.reorderPoint}`)
    .join("\n");

  const message =
    lowStockItems.length > 3
      ? `${itemsSummary}\n...and ${lowStockItems.length - 3} more items`
      : itemsSummary;

  // Send notifications to all inventory managers
  const notificationsSent = await createNotificationsForUsers(
    userIds,
    "low_stock_alert",
    title,
    message,
    "/assets/inventory?filter=low-stock"
  );

  return {
    lowStockCount: lowStockItems.length,
    notificationsSent,
    items: lowStockItems,
  };
}

/**
 * Gets the current low stock items without sending notifications.
 * Useful for displaying in the UI.
 */
export async function getLowStockItems(): Promise<LowStockItem[]> {
  const levels = await db.query.inventoryLevels.findMany({
    with: {
      part: true,
      location: true,
    },
  });

  return levels
    .filter((level) => {
      if (!level.part || !level.part.isActive) return false;
      return level.quantity <= level.part.reorderPoint;
    })
    .map((level) => ({
      id: level.id,
      partId: level.partId,
      partName: level.part!.name,
      partSku: level.part!.sku,
      locationName: level.location?.name || "Unknown",
      quantity: level.quantity,
      reorderPoint: level.part!.reorderPoint,
    }))
    .sort((a, b) => a.quantity - b.quantity); // Sort by lowest quantity first
}

/**
 * Gets the count of low stock items for quick display.
 */
export async function getLowStockCount(): Promise<number> {
  const levels = await db.query.inventoryLevels.findMany({
    with: {
      part: {
        columns: { reorderPoint: true, isActive: true },
      },
    },
  });

  return levels.filter((level) => {
    if (!level.part || !level.part.isActive) return false;
    return level.quantity <= level.part.reorderPoint;
  }).length;
}
