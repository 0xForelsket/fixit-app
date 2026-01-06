import { db } from "@/db";
import {
  inventoryLevels,
  inventoryTransactions,
  spareParts,
  vendors,
} from "@/db/schema";
import { and, asc, count, desc, eq, like, or } from "drizzle-orm";

// ==================== Types ====================

export type SparePartCategory =
  | "electrical"
  | "mechanical"
  | "hydraulic"
  | "pneumatic"
  | "consumable"
  | "safety"
  | "tooling"
  | "other";

export interface SparePartFilters {
  category?: SparePartCategory;
  vendorId?: string;
  lowStock?: boolean;
  search?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// ==================== Spare Parts Queries ====================

/**
 * Get paginated spare parts with filters
 */
export async function getSpareParts(
  filters: SparePartFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (filters.category) {
    conditions.push(eq(spareParts.category, filters.category));
  }

  if (filters.vendorId) {
    conditions.push(eq(spareParts.vendorId, filters.vendorId));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(spareParts.isActive, filters.isActive));
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(spareParts.name, searchPattern),
        like(spareParts.sku, searchPattern)
      )
    );
  }

  const [items, totalResult] = await Promise.all([
    db.query.spareParts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        vendor: { columns: { id: true, name: true } },
        inventoryLevels: {
          with: { location: { columns: { id: true, name: true } } },
        },
      },
      orderBy: [asc(spareParts.name)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: count() })
      .from(spareParts)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  // Filter for low stock if needed
  let filteredItems = items;
  if (filters.lowStock) {
    filteredItems = items.filter((part) => {
      const totalStock = part.inventoryLevels.reduce(
        (sum, level) => sum + level.quantity,
        0
      );
      return totalStock <= (part.reorderPoint || 0);
    });
  }

  return {
    items: filteredItems,
    total: filters.lowStock ? filteredItems.length : totalResult[0]?.count || 0,
    page,
    pageSize,
    totalPages: Math.ceil(
      (filters.lowStock ? filteredItems.length : totalResult[0]?.count || 0) /
        pageSize
    ),
  };
}

/**
 * Get spare part by ID
 */
export async function getSparePartById(id: string) {
  return db.query.spareParts.findFirst({
    where: eq(spareParts.id, id),
    with: {
      vendor: true,
      inventoryLevels: {
        with: { location: true },
      },
    },
  });
}

/**
 * Get spare part by SKU
 */
export async function getSparePartBySku(sku: string) {
  return db.query.spareParts.findFirst({
    where: eq(spareParts.sku, sku),
    with: {
      vendor: true,
      inventoryLevels: {
        with: { location: true },
      },
    },
  });
}

/**
 * Get low stock parts
 */
export async function getLowStockParts() {
  const parts = await db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
    with: {
      inventoryLevels: true,
    },
  });

  return parts.filter((part) => {
    const totalStock = part.inventoryLevels.reduce(
      (sum, level) => sum + level.quantity,
      0
    );
    return totalStock <= (part.reorderPoint || 0);
  });
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats() {
  const parts = await db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
    with: {
      inventoryLevels: true,
    },
  });

  const totalParts = parts.length;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const part of parts) {
    const totalStock = part.inventoryLevels.reduce(
      (sum, level) => sum + level.quantity,
      0
    );
    totalValue += totalStock * (part.unitCost || 0);

    if (totalStock === 0) {
      outOfStockCount++;
    } else if (totalStock <= (part.reorderPoint || 0)) {
      lowStockCount++;
    }
  }

  return {
    totalParts,
    totalValue,
    lowStockCount,
    outOfStockCount,
  };
}

// ==================== Spare Parts Mutations ====================

export interface CreateSparePartData {
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  category:
    | "electrical"
    | "mechanical"
    | "hydraulic"
    | "pneumatic"
    | "consumable"
    | "safety"
    | "tooling"
    | "other";
  unitCost?: number | null;
  reorderPoint?: number;
  leadTimeDays?: number | null;
  vendorId?: string | null;
  isActive?: boolean;
}

/**
 * Create spare part
 */
export async function createSparePartRecord(data: CreateSparePartData) {
  const [part] = await db
    .insert(spareParts)
    .values({
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      description: data.description,
      category: data.category,
      unitCost: data.unitCost,
      reorderPoint: data.reorderPoint ?? 0,
      leadTimeDays: data.leadTimeDays,
      vendorId: data.vendorId,
      isActive: data.isActive ?? true,
    })
    .returning();

  return part;
}

/**
 * Update spare part
 */
export async function updateSparePartRecord(
  id: string,
  data: Partial<CreateSparePartData>
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.barcode !== undefined) updateData.barcode = data.barcode;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
  if (data.reorderPoint !== undefined)
    updateData.reorderPoint = data.reorderPoint;
  if (data.leadTimeDays !== undefined)
    updateData.leadTimeDays = data.leadTimeDays;
  if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(spareParts)
    .set(updateData)
    .where(eq(spareParts.id, id))
    .returning();

  return updated;
}

/**
 * Delete spare part
 */
export async function deleteSparePartRecord(id: string) {
  await db.delete(spareParts).where(eq(spareParts.id, id));
}

// ==================== Inventory Levels ====================

/**
 * Get inventory level for a part at a location
 */
export async function getInventoryLevel(partId: string, locationId: string) {
  return db.query.inventoryLevels.findFirst({
    where: and(
      eq(inventoryLevels.partId, partId),
      eq(inventoryLevels.locationId, locationId)
    ),
  });
}

/**
 * Update or create inventory level
 */
export async function upsertInventoryLevel(
  partId: string,
  locationId: string,
  quantity: number
) {
  const existing = await getInventoryLevel(partId, locationId);

  if (existing) {
    const [updated] = await db
      .update(inventoryLevels)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(inventoryLevels.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(inventoryLevels)
    .values({ partId, locationId, quantity })
    .returning();

  return created;
}

/**
 * Adjust inventory level (add or subtract) and log the transaction
 */
export async function adjustInventoryLevel(
  partId: string,
  locationId: string,
  adjustment: number,
  createdById: string,
  type: "in" | "out" | "transfer" | "adjustment",
  notes?: string,
  reference?: string,
  workOrderId?: string,
  toLocationId?: string
) {
  const existing = await getInventoryLevel(partId, locationId);
  const currentQuantity = existing?.quantity || 0;
  const newQuantity = Math.max(0, currentQuantity + adjustment);

  // Update or create inventory level
  await upsertInventoryLevel(partId, locationId, newQuantity);

  // Log the transaction
  const [transaction] = await db
    .insert(inventoryTransactions)
    .values({
      partId,
      locationId,
      type,
      quantity: Math.abs(adjustment),
      notes,
      reference,
      workOrderId,
      toLocationId,
      createdById,
    })
    .returning();

  return transaction;
}

// ==================== Inventory Transactions ====================

/**
 * Get inventory transactions
 */
export async function getInventoryTransactions(
  filters: {
    partId?: string;
    locationId?: string;
    type?: "in" | "out" | "transfer" | "adjustment";
  } = {},
  pagination: PaginationOptions = { page: 1, pageSize: 50 }
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (filters.partId) {
    conditions.push(eq(inventoryTransactions.partId, filters.partId));
  }

  if (filters.locationId) {
    conditions.push(eq(inventoryTransactions.locationId, filters.locationId));
  }

  if (filters.type) {
    conditions.push(eq(inventoryTransactions.type, filters.type));
  }

  const [items, totalResult] = await Promise.all([
    db.query.inventoryTransactions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        part: { columns: { id: true, name: true, sku: true } },
        location: { columns: { id: true, name: true } },
        createdBy: { columns: { id: true, name: true } },
      },
      orderBy: [desc(inventoryTransactions.createdAt)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: count() })
      .from(inventoryTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  return {
    items,
    total: totalResult[0]?.count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((totalResult[0]?.count || 0) / pageSize),
  };
}

// ==================== Vendors ====================

/**
 * Get all vendors
 */
export async function getVendors() {
  return db.query.vendors.findMany({
    orderBy: [asc(vendors.name)],
  });
}

/**
 * Get vendor by ID
 */
export async function getVendorById(id: string) {
  return db.query.vendors.findFirst({
    where: eq(vendors.id, id),
    with: {
      parts: {
        columns: { id: true, name: true, sku: true },
      },
    },
  });
}

/**
 * Create vendor
 */
export async function createVendorRecord(data: {
  name: string;
  code: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}) {
  const [vendor] = await db
    .insert(vendors)
    .values({
      name: data.name,
      code: data.code,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      notes: data.notes,
      isActive: data.isActive ?? true,
    })
    .returning();
  return vendor;
}

/**
 * Update vendor
 */
export async function updateVendorRecord(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
  }>
) {
  const [updated] = await db
    .update(vendors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vendors.id, id))
    .returning();

  return updated;
}

/**
 * Delete vendor
 */
export async function deleteVendorRecord(id: string) {
  await db.delete(vendors).where(eq(vendors.id, id));
}
