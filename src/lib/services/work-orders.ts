import { db } from "@/db";
import {
  attachments,
  checklistCompletions,
  maintenanceChecklists,
  maintenanceSchedules,
  workOrderLogs,
  workOrders,
} from "@/db/schema";
import type { WorkOrder } from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  lt,
  or,
  sql,
} from "drizzle-orm";

// ==================== Types ====================

export interface WorkOrderFilters {
  status?: "open" | "in_progress" | "resolved" | "closed" | "all";
  priority?: "low" | "medium" | "high" | "critical" | "all";
  search?: string;
  assignedToId?: string;
  overdue?: boolean;
  dateRangeStart?: Date;
  departmentId?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface SortOptions {
  field: "id" | "title" | "priority" | "status" | "createdAt" | "dueBy";
  direction: "asc" | "desc";
}

export interface WorkOrderWithRelations extends WorkOrder {
  equipment?: {
    id: string;
    name: string;
    code: string;
    locationId: string;
    location?: { name: string } | null;
  } | null;
  assignedTo?: { id: string; name: string } | null;
  reportedBy?: { id: string; name: string } | null;
  _count?: {
    attachments: number;
  };
}

// ==================== Query Helpers ====================

function buildWorkOrderConditions(filters: WorkOrderFilters) {
  const conditions = [];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(workOrders.status, filters.status));
  }

  if (filters.priority && filters.priority !== "all") {
    conditions.push(eq(workOrders.priority, filters.priority));
  }

  if (filters.assignedToId) {
    conditions.push(eq(workOrders.assignedToId, filters.assignedToId));
  }

  if (filters.departmentId) {
    conditions.push(eq(workOrders.departmentId, filters.departmentId));
  }

  if (filters.overdue) {
    conditions.push(lt(workOrders.dueBy, new Date()));
    conditions.push(inArray(workOrders.status, ["open", "in_progress"]));
  }

  if (filters.dateRangeStart) {
    conditions.push(gte(workOrders.createdAt, filters.dateRangeStart));
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(workOrders.title, searchPattern),
        sql`CAST(${workOrders.displayId} AS TEXT) LIKE ${searchPattern}`
      )
    );
  }

  return conditions;
}

// ==================== Work Order Queries ====================

/**
 * Get paginated work orders with filters
 */
export async function getWorkOrders(
  filters: WorkOrderFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 10 },
  sort: SortOptions = { field: "createdAt", direction: "desc" }
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const conditions = buildWorkOrderConditions(filters);

  // Build order clause
  const orderColumn = {
    id: workOrders.displayId,
    title: workOrders.title,
    priority: workOrders.priority,
    status: workOrders.status,
    createdAt: workOrders.createdAt,
    dueBy: workOrders.dueBy,
  }[sort.field];

  const orderFn = sort.direction === "asc" ? asc : desc;

  const [items, totalResult] = await Promise.all([
    db.query.workOrders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        equipment: {
          columns: { id: true, name: true, code: true, locationId: true },
          with: {
            location: { columns: { name: true } },
          },
        },
        assignedTo: { columns: { id: true, name: true } },
        reportedBy: { columns: { id: true, name: true } },
      },
      orderBy: [orderFn(orderColumn)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: count() })
      .from(workOrders)
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
 * Get a single work order by ID with full relations
 */
export async function getWorkOrderById(id: string) {
  return db.query.workOrders.findFirst({
    where: eq(workOrders.id, id),
    with: {
      equipment: {
        with: {
          location: true,
          model: true,
        },
      },
      assignedTo: true,
      reportedBy: true,
      logs: {
        with: { createdBy: true },
        orderBy: [desc(workOrderLogs.createdAt)],
      },
      parts: {
        with: { part: true },
      },
    },
  });
}

/**
 * Get work order by display ID
 */
export async function getWorkOrderByDisplayId(displayId: number) {
  return db.query.workOrders.findFirst({
    where: eq(workOrders.displayId, displayId),
    with: {
      equipment: {
        with: {
          location: true,
          model: true,
        },
      },
      assignedTo: true,
      reportedBy: true,
      logs: {
        with: { createdBy: true },
        orderBy: [desc(workOrderLogs.createdAt)],
      },
      parts: {
        with: { part: true },
      },
    },
  });
}

/**
 * Get work order statistics
 */
export async function getWorkOrderStats(departmentId?: string) {
  const baseCondition = departmentId
    ? eq(workOrders.departmentId, departmentId)
    : undefined;

  const [openCount, inProgressCount, overdueCount, criticalCount] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(workOrders)
        .where(
          baseCondition
            ? and(baseCondition, eq(workOrders.status, "open"))
            : eq(workOrders.status, "open")
        ),
      db
        .select({ count: count() })
        .from(workOrders)
        .where(
          baseCondition
            ? and(baseCondition, eq(workOrders.status, "in_progress"))
            : eq(workOrders.status, "in_progress")
        ),
      db
        .select({ count: count() })
        .from(workOrders)
        .where(
          baseCondition
            ? and(
                baseCondition,
                lt(workOrders.dueBy, new Date()),
                inArray(workOrders.status, ["open", "in_progress"])
              )
            : and(
                lt(workOrders.dueBy, new Date()),
                inArray(workOrders.status, ["open", "in_progress"])
              )
        ),
      db
        .select({ count: count() })
        .from(workOrders)
        .where(
          baseCondition
            ? and(
                baseCondition,
                eq(workOrders.priority, "critical"),
                inArray(workOrders.status, ["open", "in_progress"])
              )
            : and(
                eq(workOrders.priority, "critical"),
                inArray(workOrders.status, ["open", "in_progress"])
              )
        ),
    ]);

  return {
    open: openCount[0]?.count || 0,
    inProgress: inProgressCount[0]?.count || 0,
    overdue: overdueCount[0]?.count || 0,
    critical: criticalCount[0]?.count || 0,
  };
}

/**
 * Get work orders assigned to a user
 */
export async function getWorkOrdersAssignedTo(userId: string) {
  return db.query.workOrders.findMany({
    where: and(
      eq(workOrders.assignedToId, userId),
      inArray(workOrders.status, ["open", "in_progress"])
    ),
    with: {
      equipment: {
        columns: { id: true, name: true, code: true },
        with: { location: { columns: { name: true } } },
      },
    },
    orderBy: [
      // Priority order: critical > high > medium > low
      sql`CASE ${workOrders.priority}
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END`,
      asc(workOrders.dueBy),
    ],
  });
}

/**
 * Get recent work orders for dashboard
 */
export async function getRecentWorkOrders(limit = 5, departmentId?: string) {
  const condition = departmentId
    ? eq(workOrders.departmentId, departmentId)
    : undefined;

  return db.query.workOrders.findMany({
    where: condition,
    with: {
      equipment: { columns: { name: true, code: true } },
      assignedTo: { columns: { name: true } },
    },
    orderBy: [desc(workOrders.createdAt)],
    limit,
  });
}

// ==================== Work Order Mutations ====================

export interface CreateWorkOrderData {
  equipmentId: string;
  type:
    | "breakdown"
    | "maintenance"
    | "calibration"
    | "safety"
    | "upgrade"
    | "inspection";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  reportedById: string;
  departmentId?: string | null;
  dueBy: Date;
  attachments?: {
    filename: string;
    s3Key: string;
    mimeType: string;
    sizeBytes: number;
  }[];
}

/**
 * Create a new work order with attachments
 */
export async function createWorkOrderRecord(
  data: CreateWorkOrderData,
  userId: string
) {
  return db.transaction(async (tx) => {
    const [newWorkOrder] = await tx
      .insert(workOrders)
      .values({
        equipmentId: data.equipmentId,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        reportedById: data.reportedById,
        departmentId: data.departmentId,
        status: "open",
        dueBy: data.dueBy,
      })
      .returning();

    if (data.attachments && data.attachments.length > 0) {
      await tx.insert(attachments).values(
        data.attachments.map((att) => ({
          entityType: "work_order" as const,
          entityId: newWorkOrder.id,
          type: "photo" as const,
          filename: att.filename,
          s3Key: att.s3Key,
          mimeType: att.mimeType,
          sizeBytes: att.sizeBytes,
          uploadedById: userId,
        }))
      );
    }

    return newWorkOrder;
  });
}

/**
 * Update a work order
 */
export async function updateWorkOrderRecord(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "in_progress" | "resolved" | "closed";
    assignedToId: string | null;
    dueBy: Date;
  }>
) {
  const [updated] = await db
    .update(workOrders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workOrders.id, id))
    .returning();

  return updated;
}

/**
 * Assign work order to user
 */
export async function assignWorkOrder(
  workOrderId: string,
  assignedToId: string | null
) {
  const [updated] = await db
    .update(workOrders)
    .set({
      assignedToId,
      status: assignedToId ? "in_progress" : "open",
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, workOrderId))
    .returning();

  return updated;
}

/**
 * Resolve a work order
 */
export async function resolveWorkOrderRecord(
  id: string,
  data: {
    resolutionNotes: string;
  }
) {
  const [updated] = await db
    .update(workOrders)
    .set({
      status: "resolved",
      resolutionNotes: data.resolutionNotes,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, id))
    .returning();

  return updated;
}

/**
 * Close a work order
 */
export async function closeWorkOrderRecord(id: string) {
  const [updated] = await db
    .update(workOrders)
    .set({
      status: "closed",
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, id))
    .returning();

  return updated;
}

// ==================== Work Order Logs ====================

/**
 * Add a log entry to a work order
 */
export async function addWorkOrderLog(
  workOrderId: string,
  createdById: string,
  action: "status_change" | "comment" | "assignment",
  details: {
    oldValue?: string;
    newValue: string;
  }
) {
  const [log] = await db
    .insert(workOrderLogs)
    .values({
      workOrderId,
      createdById,
      action,
      oldValue: details.oldValue,
      newValue: details.newValue,
    })
    .returning();

  return log;
}

/**
 * Get logs for a work order
 */
export async function getWorkOrderLogs(workOrderId: string) {
  return db.query.workOrderLogs.findMany({
    where: eq(workOrderLogs.workOrderId, workOrderId),
    with: { createdBy: { columns: { id: true, name: true } } },
    orderBy: [desc(workOrderLogs.createdAt)],
  });
}

// ==================== Checklist Operations ====================

/**
 * Get checklist for a work order based on equipment's maintenance schedules
 */
export async function getWorkOrderChecklist(workOrderId: string) {
  // Get the work order to find the equipment
  const workOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
    columns: { equipmentId: true },
  });

  if (!workOrder?.equipmentId) return [];

  // Find active maintenance schedules for this equipment
  const schedules = await db.query.maintenanceSchedules.findMany({
    where: and(
      eq(maintenanceSchedules.equipmentId, workOrder.equipmentId),
      eq(maintenanceSchedules.isActive, true)
    ),
  });

  if (schedules.length === 0) return [];

  // Get checklist items for all schedules
  const items = await db.query.maintenanceChecklists.findMany({
    where: inArray(
      maintenanceChecklists.scheduleId,
      schedules.map((s) => s.id)
    ),
    orderBy: [asc(maintenanceChecklists.stepNumber)],
  });

  // Get completions for this work order
  const completions = await db.query.checklistCompletions.findMany({
    where: eq(checklistCompletions.workOrderId, workOrderId),
  });

  const completionMap = new Map(completions.map((c) => [c.checklistId, c]));

  return items.map((item) => ({
    ...item,
    completion: completionMap.get(item.id) || null,
  }));
}

/**
 * Update checklist item completion
 */
export async function updateChecklistCompletion(
  workOrderId: string,
  checklistId: string,
  completedById: string,
  status: "pending" | "completed" | "skipped" | "na",
  notes?: string
) {
  const existing = await db.query.checklistCompletions.findFirst({
    where: and(
      eq(checklistCompletions.workOrderId, workOrderId),
      eq(checklistCompletions.checklistId, checklistId)
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(checklistCompletions)
      .set({
        status,
        notes,
        completedById,
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(checklistCompletions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(checklistCompletions)
    .values({
      workOrderId,
      checklistId,
      status,
      notes,
      completedById,
      completedAt: status === "completed" ? new Date() : null,
    })
    .returning();

  return created;
}
