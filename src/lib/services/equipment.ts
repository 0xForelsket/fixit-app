import { db } from "@/db";
import {
  equipment,
  equipmentCategories,
  equipmentMeters,
  equipmentModels,
  equipmentStatusLogs,
  equipmentTypes,
  meterReadings,
} from "@/db/schema";
import { and, asc, count, desc, eq, like, or } from "drizzle-orm";

// ==================== Types ====================

export interface EquipmentFilters {
  status?: "operational" | "down" | "maintenance" | "all";
  locationId?: string;
  categoryId?: string;
  typeId?: string;
  departmentId?: string;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface SortOptions {
  field: "name" | "code" | "status" | "createdAt";
  direction: "asc" | "desc";
}

// ==================== Equipment Queries ====================

/**
 * Get paginated equipment list with filters
 */
export async function getEquipmentList(
  filters: EquipmentFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 },
  sort: SortOptions = { field: "name", direction: "asc" }
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(equipment.status, filters.status));
  }

  if (filters.locationId) {
    conditions.push(eq(equipment.locationId, filters.locationId));
  }

  if (filters.departmentId) {
    conditions.push(eq(equipment.departmentId, filters.departmentId));
  }

  if (filters.typeId) {
    conditions.push(eq(equipment.typeId, filters.typeId));
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(equipment.name, searchPattern),
        like(equipment.code, searchPattern),
        like(equipment.serialNumber, searchPattern)
      )
    );
  }

  const orderColumn = {
    name: equipment.name,
    code: equipment.code,
    status: equipment.status,
    createdAt: equipment.createdAt,
  }[sort.field];

  const orderFn = sort.direction === "asc" ? asc : desc;

  const [items, totalResult] = await Promise.all([
    db.query.equipment.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        location: { columns: { id: true, name: true } },
        type: {
          columns: { id: true, name: true },
          with: { category: { columns: { id: true, name: true } } },
        },
        model: { columns: { id: true, name: true } },
        responsibleDepartment: { columns: { id: true, name: true } },
      },
      orderBy: [orderFn(orderColumn)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: count() })
      .from(equipment)
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

/**
 * Get equipment by ID with full relations
 */
export async function getEquipmentById(id: string) {
  return db.query.equipment.findFirst({
    where: eq(equipment.id, id),
    with: {
      location: true,
      type: { with: { category: true } },
      model: {
        with: { bom: { with: { part: { with: { inventoryLevels: true } } } } },
      },
      responsibleDepartment: true,
      owner: true,
      parent: { columns: { id: true, name: true, code: true } },
      meters: {
        with: {
          readings: {
            orderBy: [desc(meterReadings.recordedAt)],
            limit: 10,
          },
        },
      },
    },
  });
}

/**
 * Get equipment by code
 */
export async function getEquipmentByCode(code: string) {
  return db.query.equipment.findFirst({
    where: eq(equipment.code, code),
    with: {
      location: true,
      type: { with: { category: true } },
      model: {
        with: { bom: { with: { part: { with: { inventoryLevels: true } } } } },
      },
      responsibleDepartment: true,
      owner: true,
      parent: { columns: { id: true, name: true, code: true } },
      meters: {
        with: {
          readings: {
            orderBy: [desc(meterReadings.recordedAt)],
            limit: 10,
          },
        },
      },
    },
  });
}

/**
 * Get equipment statistics
 */
export async function getEquipmentStats(departmentId?: string) {
  const baseCondition = departmentId
    ? eq(equipment.departmentId, departmentId)
    : undefined;

  const [totalCount, operationalCount, downCount, maintenanceCount] =
    await Promise.all([
      db.select({ count: count() }).from(equipment).where(baseCondition),
      db
        .select({ count: count() })
        .from(equipment)
        .where(
          baseCondition
            ? and(baseCondition, eq(equipment.status, "operational"))
            : eq(equipment.status, "operational")
        ),
      db
        .select({ count: count() })
        .from(equipment)
        .where(
          baseCondition
            ? and(baseCondition, eq(equipment.status, "down"))
            : eq(equipment.status, "down")
        ),
      db
        .select({ count: count() })
        .from(equipment)
        .where(
          baseCondition
            ? and(baseCondition, eq(equipment.status, "maintenance"))
            : eq(equipment.status, "maintenance")
        ),
    ]);

  return {
    total: totalCount[0]?.count || 0,
    operational: operationalCount[0]?.count || 0,
    down: downCount[0]?.count || 0,
    maintenance: maintenanceCount[0]?.count || 0,
  };
}

/**
 * Get equipment for dropdown selection
 */
export async function getEquipmentForSelect(departmentId?: string) {
  const condition = departmentId
    ? eq(equipment.departmentId, departmentId)
    : undefined;

  return db.query.equipment.findMany({
    where: condition,
    columns: { id: true, name: true, code: true },
    orderBy: [asc(equipment.name)],
  });
}

/**
 * Get equipment hierarchy (children)
 */
export async function getEquipmentChildren(parentId: string) {
  return db.query.equipment.findMany({
    where: eq(equipment.parentId, parentId),
    columns: { id: true, name: true, code: true, status: true },
    orderBy: [asc(equipment.name)],
  });
}

// ==================== Equipment Mutations ====================

export interface CreateEquipmentData {
  name: string;
  code: string;
  status?: "operational" | "down" | "maintenance";
  locationId: string;
  typeId?: string | null;
  modelId?: string | null;
  departmentId?: string | null;
  ownerId?: string | null;
  parentId?: string | null;
  serialNumber?: string | null;
  manufacturer?: string | null;
  modelYear?: number | null;
  warrantyExpiration?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  residualValue?: string | null;
  usefulLifeYears?: number | null;
}

/**
 * Create new equipment
 */
export async function createEquipmentRecord(data: CreateEquipmentData) {
  const [newEquipment] = await db
    .insert(equipment)
    .values({
      name: data.name,
      code: data.code,
      status: data.status || "operational",
      locationId: data.locationId,
      typeId: data.typeId,
      modelId: data.modelId,
      departmentId: data.departmentId,
      ownerId: data.ownerId,
      parentId: data.parentId,
      serialNumber: data.serialNumber,
      manufacturer: data.manufacturer,
      modelYear: data.modelYear,
      warrantyExpiration: data.warrantyExpiration
        ? new Date(data.warrantyExpiration)
        : null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: data.purchasePrice,
      residualValue: data.residualValue,
      usefulLifeYears: data.usefulLifeYears,
    })
    .returning();

  return newEquipment;
}

/**
 * Update equipment
 */
export async function updateEquipmentRecord(
  id: string,
  data: Partial<CreateEquipmentData>
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.locationId !== undefined) updateData.locationId = data.locationId;
  if (data.typeId !== undefined) updateData.typeId = data.typeId;
  if (data.modelId !== undefined) updateData.modelId = data.modelId;
  if (data.departmentId !== undefined)
    updateData.departmentId = data.departmentId;
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
  if (data.parentId !== undefined) updateData.parentId = data.parentId;
  if (data.serialNumber !== undefined)
    updateData.serialNumber = data.serialNumber;
  if (data.manufacturer !== undefined)
    updateData.manufacturer = data.manufacturer;
  if (data.modelYear !== undefined) updateData.modelYear = data.modelYear;
  if (data.warrantyExpiration !== undefined)
    updateData.warrantyExpiration = data.warrantyExpiration
      ? new Date(data.warrantyExpiration)
      : null;
  if (data.purchaseDate !== undefined)
    updateData.purchaseDate = data.purchaseDate
      ? new Date(data.purchaseDate)
      : null;
  if (data.purchasePrice !== undefined)
    updateData.purchasePrice = data.purchasePrice;
  if (data.residualValue !== undefined)
    updateData.residualValue = data.residualValue;
  if (data.usefulLifeYears !== undefined)
    updateData.usefulLifeYears = data.usefulLifeYears;

  const [updated] = await db
    .update(equipment)
    .set(updateData)
    .where(eq(equipment.id, id))
    .returning();

  return updated;
}

/**
 * Update equipment status
 */
export async function updateEquipmentStatus(
  id: string,
  status: "operational" | "down" | "maintenance",
  userId: string,
  notes?: string
) {
  const current = await db.query.equipment.findFirst({
    where: eq(equipment.id, id),
    columns: { status: true },
  });

  if (!current) return null;

  // Log the status change
  await db.insert(equipmentStatusLogs).values({
    equipmentId: id,
    oldStatus: current.status,
    newStatus: status,
    changedById: userId,
  });

  const [updated] = await db
    .update(equipment)
    .set({ status, updatedAt: new Date() })
    .where(eq(equipment.id, id))
    .returning();

  return updated;
}

/**
 * Delete equipment
 */
export async function deleteEquipmentRecord(id: string) {
  await db.delete(equipment).where(eq(equipment.id, id));
}

// ==================== Equipment Categories & Types ====================

/**
 * Get all equipment categories with types
 */
export async function getEquipmentCategories() {
  return db.query.equipmentCategories.findMany({
    with: { types: true },
    orderBy: [asc(equipmentCategories.name)],
  });
}

/**
 * Get equipment types for a category
 */
export async function getEquipmentTypes(categoryId?: string) {
  const condition = categoryId
    ? eq(equipmentTypes.categoryId, categoryId)
    : undefined;

  return db.query.equipmentTypes.findMany({
    where: condition,
    orderBy: [asc(equipmentTypes.name)],
  });
}

// ==================== Equipment Models ====================

/**
 * Get all equipment models
 */
export async function getEquipmentModels() {
  return db.query.equipmentModels.findMany({
    with: {
      bom: {
        with: { part: true },
      },
    },
    orderBy: [asc(equipmentModels.name)],
  });
}

/**
 * Get equipment model by ID
 */
export async function getEquipmentModelById(id: string) {
  return db.query.equipmentModels.findFirst({
    where: eq(equipmentModels.id, id),
    with: {
      bom: {
        with: { part: { with: { inventoryLevels: true } } },
      },
    },
  });
}

// ==================== Equipment Meters ====================

/**
 * Get meters for equipment
 */
export async function getEquipmentMeters(equipmentId: string) {
  return db.query.equipmentMeters.findMany({
    where: eq(equipmentMeters.equipmentId, equipmentId),
    with: {
      readings: {
        orderBy: [desc(meterReadings.recordedAt)],
        limit: 20,
      },
    },
  });
}

/**
 * Record a meter reading
 */
export async function recordMeterReading(
  meterId: string,
  reading: number,
  userId: string,
  recordedAt?: Date
) {
  const [newReading] = await db
    .insert(meterReadings)
    .values({
      meterId,
      reading: reading.toString(),
      recordedById: userId,
      recordedAt: recordedAt || new Date(),
    })
    .returning();

  // Update current reading on meter
  await db
    .update(equipmentMeters)
    .set({
      currentReading: reading.toString(),
      lastReadingDate: recordedAt || new Date(),
    })
    .where(eq(equipmentMeters.id, meterId));

  return newReading;
}

/**
 * Create equipment meter
 */
export async function createEquipmentMeter(data: {
  equipmentId: string;
  name: string;
  type: "hours" | "miles" | "kilometers" | "cycles" | "units";
  unit: string;
  currentReading?: number;
}) {
  const [meter] = await db
    .insert(equipmentMeters)
    .values({
      equipmentId: data.equipmentId,
      name: data.name,
      type: data.type,
      unit: data.unit,
      currentReading: (data.currentReading || 0).toString(),
    })
    .returning();

  return meter;
}

/**
 * Update equipment meter
 */
export async function updateEquipmentMeter(
  id: string,
  data: Partial<{
    name: string;
    type: "hours" | "miles" | "kilometers" | "cycles" | "units";
    unit: string;
  }>
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.unit !== undefined) updateData.unit = data.unit;

  const [updated] = await db
    .update(equipmentMeters)
    .set(updateData)
    .where(eq(equipmentMeters.id, id))
    .returning();

  return updated;
}

/**
 * Delete equipment meter
 */
export async function deleteEquipmentMeter(id: string) {
  await db.delete(equipmentMeters).where(eq(equipmentMeters.id, id));
}
