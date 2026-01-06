import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

// Enums as const objects for type safety
export const reportFrequencies = ["daily", "weekly", "monthly"] as const;
export type ReportFrequency = (typeof reportFrequencies)[number];

// Enums as const objects for type safety
export const userRoles = ["operator", "tech", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const equipmentStatuses = [
  "operational",
  "down",
  "maintenance",
] as const;
export type EquipmentStatus = (typeof equipmentStatuses)[number];

export const workOrderTypes = [
  "breakdown",
  "maintenance",
  "calibration",
  "safety",
  "upgrade",
  "inspection",
] as const;
export type WorkOrderType = (typeof workOrderTypes)[number];

export const workOrderPriorities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type WorkOrderPriority = (typeof workOrderPriorities)[number];

export const workOrderStatuses = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export const scheduleTypes = ["maintenance", "calibration"] as const;
export type ScheduleType = (typeof scheduleTypes)[number];

export const workOrderLogActions = [
  "status_change",
  "comment",
  "assignment",
] as const;
export type WorkOrderLogAction = (typeof workOrderLogActions)[number];

export const entityTypes = [
  "user",
  "equipment",
  "work_order",
  "location",
  "vendor",
  "spare_part",
] as const;
export type EntityType = (typeof entityTypes)[number];

export const attachmentTypes = [
  "avatar",
  "photo",
  "document",
  "before",
  "after",
  "signature",
] as const;
export type AttachmentType = (typeof attachmentTypes)[number];

export const notificationTypes = [
  "work_order_created",
  "work_order_assigned",
  "work_order_escalated",
  "work_order_resolved",
  "work_order_commented",
  "work_order_status_changed",
  "maintenance_due",
  "low_stock_alert",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

// Phase 10: Checklist statuses
export const checklistItemStatuses = [
  "pending",
  "completed",
  "skipped",
  "na",
] as const;
export type ChecklistItemStatus = (typeof checklistItemStatuses)[number];

// Equipment Premium: Meter types (Phase 4)
export const meterTypes = [
  "hours",
  "miles",
  "kilometers",
  "cycles",
  "units",
] as const;
export type MeterType = (typeof meterTypes)[number];

// Equipment Premium: Downtime reasons (Phase 3)
export const downtimeReasons = [
  "mechanical_failure",
  "electrical_failure",
  "no_operator",
  "no_materials",
  "planned_maintenance",
  "changeover",
  "other",
] as const;
export type DowntimeReason = (typeof downtimeReasons)[number];

// Phase 12: Inventory enums
export const partCategories = [
  "electrical",
  "mechanical",
  "hydraulic",
  "pneumatic",
  "consumable",
  "safety",
  "tooling",
  "other",
] as const;
export type PartCategory = (typeof partCategories)[number];

export const transactionTypes = [
  "in",
  "out",
  "transfer",
  "adjustment",
] as const;
export type TransactionType = (typeof transactionTypes)[number];

// In-app notification preferences per type
export interface InAppNotificationPreferences {
  workOrderCreated: boolean;
  workOrderAssigned: boolean;
  workOrderEscalated: boolean;
  workOrderResolved: boolean;
  workOrderCommented: boolean;
  workOrderStatusChanged: boolean;
  maintenanceDue: boolean;
}

// User preferences type
export interface UserPreferences {
  theme: "system" | "light" | "dark";
  density: "compact" | "comfortable";
  notifications: {
    email: boolean;
    inApp?: InAppNotificationPreferences;
  };
}

// ============ TABLES ============

export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").unique().notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().$type<string[]>().default([]),
  isSystemRole: boolean("is_system_role").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const departments = pgTable("departments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").unique().notNull(), // e.g., "Electrical", "Mechanical", "Facilities"
  code: text("code").unique().notNull(), // e.g., "ELEC", "MECH"
  description: text("description"),
  managerId: text("manager_id"), // Dept Manager - removed explicit .references() to avoid circularity
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Users table
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    employeeId: text("employee_id").unique().notNull(),
    name: text("name").notNull(),
    email: text("email").unique(),
    pin: text("pin").notNull(),
    roleId: text("role_id").references(() => roles.id),
    departmentId: text("department_id").references(() => departments.id),
    isActive: boolean("is_active").notNull().default(true),
    hourlyRate: real("hourly_rate"), // For labor cost tracking
    preferences: jsonb("preferences").$type<UserPreferences>(),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    // Session version - increment when PIN changes to invalidate all existing sessions
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    deptRoleIdx: index("users_dept_role_idx").on(
      table.departmentId,
      table.roleId
    ),
  })
);

// Locations table (hierarchical)
export const locations = pgTable("locations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  parentId: text("parent_id"), // Self-reference handled in relations
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SAP-style Equipment Categories (e.g., Mechanical, Electrical)
export const equipmentCategories = pgTable("equipment_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(), // e.g., "M"
  label: text("label").notNull(), // e.g., "Mechanical"
  description: text("description"),
});

// SAP-style Object Types (e.g., Pump, Motor)
export const equipmentTypes = pgTable("equipment_types", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  categoryId: text("category_id")
    .references(() => equipmentCategories.id)
    .notNull(),
  name: text("name").notNull(), // e.g., "Pump"
  code: text("code").unique().notNull(), // e.g., "PMP"
  description: text("description"),
});

// Equipment Models table
export const equipmentModels = pgTable("equipment_models", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  description: text("description"),
  manualUrl: text("manual_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Equipment table (formerly Equipment)
export const equipment = pgTable(
  "equipment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    name: text("name").notNull(),
    code: text("code").unique().notNull(), // For QR codes
    modelId: text("model_id").references(() => equipmentModels.id),
    typeId: text("type_id").references(() => equipmentTypes.id),
    locationId: text("location_id")
      .references(() => locations.id)
      .notNull(),
    ownerId: text("owner_id").references(() => users.id), // Owner
    departmentId: text("department_id").references(() => departments.id), // Responsible Department
    parentId: text("parent_id"), // Self-reference for hierarchy (Station -> Machine -> Component)
    status: text("status", { enum: equipmentStatuses })
      .notNull()
      .default("operational"),
    // Phase 1.1 - Specifications
    serialNumber: text("serial_number"),
    manufacturer: text("manufacturer"),
    modelYear: integer("model_year"),
    warrantyExpiration: timestamp("warranty_expiration"),
    // Phase 1.2 - Financials
    purchaseDate: timestamp("purchase_date"),
    purchasePrice: text("purchase_price"), // Stored as text for precision, parsed as decimal
    residualValue: text("residual_value"), // Stored as text for precision, parsed as decimal
    usefulLifeYears: integer("useful_life_years"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index("eq_code_idx").on(table.code),
    statusIdx: index("eq_status_idx").on(table.status),
    deptIdx: index("eq_dept_idx").on(table.departmentId),
    locationStatusIdx: index("eq_location_status_idx").on(
      table.locationId,
      table.status
    ),
    // Equipment owner-status filtering (for owner's equipment list)
    ownerStatusIdx: index("eq_owner_status_idx").on(
      table.ownerId,
      table.status
    ),
    // Full Text Search Index
    searchIdx: index("eq_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.name} || ' ' || ${table.code})`
    ),
  })
);

// Work Orders table
export const workOrders = pgTable(
  "work_orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    equipmentId: text("equipment_id")
      .references(() => equipment.id)
      .notNull(),
    type: text("type", { enum: workOrderTypes }).notNull(),
    reportedById: text("reported_by_id")
      .references(() => users.id)
      .notNull(),
    assignedToId: text("assigned_to_id").references(() => users.id),
    departmentId: text("department_id").references(() => departments.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priority: text("priority", { enum: workOrderPriorities })
      .notNull()
      .default("medium"),
    status: text("status", { enum: workOrderStatuses })
      .notNull()
      .default("open"),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
    escalatedAt: timestamp("escalated_at"),
    dueBy: timestamp("due_by"),
  },
  (table) => ({
    statusIdx: index("wo_status_idx").on(table.status),
    priorityIdx: index("wo_priority_idx").on(table.priority),
    dueByIdx: index("wo_due_by_idx").on(table.dueBy),
    assignedToIdx: index("wo_assigned_to_idx").on(table.assignedToId),
    // Composite indexes for common query patterns
    assignedStatusIdx: index("wo_assigned_status_idx").on(
      table.assignedToId,
      table.status
    ),
    deptStatusIdx: index("wo_dept_status_idx").on(
      table.departmentId,
      table.status
    ),
    equipmentHistoryIdx: index("wo_equipment_history_idx").on(
      table.equipmentId,
      table.createdAt
    ),
    // Work orders by equipment + status (equipment detail page)
    equipmentStatusIdx: index("wo_equipment_status_idx").on(
      table.equipmentId,
      table.status
    ),
    // Performance: Filter by Priority + Status (Dashboard)
    priorityStatusIdx: index("wo_priority_status_idx").on(
      table.priority,
      table.status
    ),
    // Full Text Search Index
    searchIdx: index("wo_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.title} || ' ' || ${table.description})`
    ),
  })
);

// ============ EQUIPMENT PREMIUM: METERS (Phase 4) ============

// Equipment meters (multiple meters per equipment)
export const equipmentMeters = pgTable(
  "equipment_meters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    equipmentId: text("equipment_id")
      .references(() => equipment.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(), // e.g., "Engine Hours", "Odometer"
    type: text("type", { enum: meterTypes }).notNull(),
    unit: text("unit").notNull(), // e.g., "hrs", "mi", "km"
    currentReading: text("current_reading"), // Stored as text for precision
    lastReadingDate: timestamp("last_reading_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    equipmentIdx: index("em_equipment_idx").on(table.equipmentId),
  })
);

// Meter readings history
export const meterReadings = pgTable(
  "meter_readings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    meterId: text("meter_id")
      .references(() => equipmentMeters.id, { onDelete: "cascade" })
      .notNull(),
    reading: text("reading").notNull(), // Stored as text for precision
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
    recordedById: text("recorded_by_id")
      .references(() => users.id)
      .notNull(),
    workOrderId: text("work_order_id").references(() => workOrders.id),
    notes: text("notes"),
  },
  (table) => ({
    meterIdx: index("mr_meter_idx").on(table.meterId),
    recordedAtIdx: index("mr_recorded_at_idx").on(table.recordedAt),
    workOrderIdx: index("mr_work_order_idx").on(table.workOrderId),
  })
);

// Maintenance schedules table
export const maintenanceSchedules = pgTable(
  "maintenance_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    equipmentId: text("equipment_id")
      .references(() => equipment.id)
      .notNull(),
    title: text("title").notNull(),
    type: text("type", { enum: scheduleTypes }).notNull(),
    frequencyDays: integer("frequency_days"), // Removed .notNull() for usage-based support

    // Usage-based maintenance (Phase 4.2)
    meterId: text("meter_id").references(() => equipmentMeters.id),
    meterInterval: integer("meter_interval"), // Trigger every X units
    lastTriggerReading: text("last_trigger_reading"), // Reading when last triggered

    lastGenerated: timestamp("last_generated"),
    nextDue: timestamp("next_due"), // Optional for usage-based
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Active schedules by next due date (for scheduler queries)
    activeNextDueIdx: index("ms_active_nextdue_idx").on(
      table.isActive,
      table.nextDue
    ),
    // Equipment's maintenance schedules
    equipmentIdx: index("ms_equipment_idx").on(table.equipmentId),
    // Meter-based schedules index
    meterIdx: index("ms_meter_idx").on(table.meterId),
  })
);

// Work Order logs table (audit trail)
export const workOrderLogs = pgTable("work_order_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  workOrderId: text("work_order_id")
    .references(() => workOrders.id)
    .notNull(),
  action: text("action", { enum: workOrderLogActions }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  createdById: text("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Attachments table (polymorphic)
export const attachments = pgTable("attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  entityType: text("entity_type", { enum: entityTypes }).notNull(),
  entityId: text("entity_id").notNull(),
  type: text("type", { enum: attachmentTypes }).notNull(),
  filename: text("filename").notNull(),
  s3Key: text("s3_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedById: text("uploaded_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    type: text("type", { enum: notificationTypes }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notif_user_idx").on(table.userId),
    // Composite index for unread notification queries
    userUnreadIdx: index("notif_user_unread_idx").on(
      table.userId,
      table.isRead
    ),
  })
);

// Equipment status logs table (for downtime tracking)
export const equipmentStatusLogs = pgTable("equipment_status_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  equipmentId: text("equipment_id")
    .references(() => equipment.id)
    .notNull(),
  oldStatus: text("old_status", { enum: equipmentStatuses }).notNull(),
  newStatus: text("new_status", { enum: equipmentStatuses }).notNull(),
  changedById: text("changed_by_id").references(() => users.id),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});

// ============ EQUIPMENT PREMIUM: DOWNTIME (Phase 3) ============

// Downtime logs for reliability tracking
export const downtimeLogs = pgTable(
  "downtime_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    equipmentId: text("equipment_id")
      .references(() => equipment.id, { onDelete: "cascade" })
      .notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    reasonCode: text("reason_code", { enum: downtimeReasons }).notNull(),
    notes: text("notes"),
    reportedById: text("reported_by_id")
      .references(() => users.id)
      .notNull(),
    workOrderId: text("work_order_id").references(() => workOrders.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    equipmentIdx: index("dl_equipment_idx").on(table.equipmentId),
    timeRangeIdx: index("dl_time_range_idx").on(table.startTime, table.endTime),
  })
);

// ============ EQUIPMENT PREMIUM: PREDICTIVE MAINTENANCE (Phase 7) ============

export const predictionTypes = [
  "failure",
  "maintenance_due",
  "replacement",
] as const;
export type PredictionType = (typeof predictionTypes)[number];

export const anomalyTypes = [
  "spike",
  "drop",
  "trend_deviation",
  "out_of_range",
] as const;
export type AnomalyType = (typeof anomalyTypes)[number];

export const anomalySeverities = ["low", "medium", "high", "critical"] as const;
export type AnomalySeverity = (typeof anomalySeverities)[number];

// Equipment failure predictions
export const equipmentPredictions = pgTable(
  "equipment_predictions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    equipmentId: text("equipment_id")
      .references(() => equipment.id, { onDelete: "cascade" })
      .notNull(),
    predictionType: text("prediction_type", {
      enum: predictionTypes,
    }).notNull(),
    probability: text("probability").notNull(), // 0-1, stored as text for precision
    estimatedDate: timestamp("estimated_date"),
    confidence: text("confidence"), // 0-1 model confidence
    factors: text("factors"), // JSON string of contributing factors
    isAcknowledged: boolean("is_acknowledged").notNull().default(false),
    acknowledgedById: text("acknowledged_by_id").references(() => users.id),
    acknowledgedAt: timestamp("acknowledged_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    equipmentIdx: index("ep_equipment_idx").on(table.equipmentId),
    activeIdx: index("ep_active_idx").on(
      table.equipmentId,
      table.isAcknowledged
    ),
  })
);

// Meter reading anomalies
export const meterAnomalies = pgTable(
  "meter_anomalies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    meterId: text("meter_id")
      .references(() => equipmentMeters.id, { onDelete: "cascade" })
      .notNull(),
    readingId: text("reading_id")
      .references(() => meterReadings.id, { onDelete: "cascade" })
      .notNull(),
    anomalyType: text("anomaly_type", { enum: anomalyTypes }).notNull(),
    severity: text("severity", { enum: anomalySeverities }).notNull(),
    expectedValue: text("expected_value").notNull(), // Moving average prediction
    actualValue: text("actual_value").notNull(),
    deviationPercent: text("deviation_percent").notNull(),
    workOrderId: text("work_order_id").references(() => workOrders.id),
    isResolved: boolean("is_resolved").notNull().default(false),
    resolvedById: text("resolved_by_id").references(() => users.id),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    meterIdx: index("ma_meter_idx").on(table.meterId),
    unresolvedIdx: index("ma_unresolved_idx").on(
      table.meterId,
      table.isResolved
    ),
  })
);

// Bill of Materials (BOM) linking models to parts
export const equipmentBoms = pgTable("equipment_boms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  modelId: text("model_id")
    .references(() => equipmentModels.id)
    .notNull(),
  partId: text("part_id")
    .references(() => spareParts.id)
    .notNull(),
  quantityRequired: integer("quantity_required").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ PHASE 10: MAINTENANCE CHECKLISTS ============

// Checklist templates linked to maintenance schedules
export const maintenanceChecklists = pgTable("maintenance_checklists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  scheduleId: text("schedule_id")
    .references(() => maintenanceSchedules.id)
    .notNull(),
  stepNumber: integer("step_number").notNull(),
  description: text("description").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Completed checklist items per work order
export const checklistCompletions = pgTable("checklist_completions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  checklistId: text("checklist_id")
    .references(() => maintenanceChecklists.id)
    .notNull(),
  workOrderId: text("work_order_id")
    .references(() => workOrders.id)
    .notNull(),
  status: text("status", { enum: checklistItemStatuses })
    .notNull()
    .default("pending"),
  completedById: text("completed_by_id").references(() => users.id),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
});

// ============ PHASE 12: INVENTORY MANAGEMENT ============

// Spare parts catalog
// Vendors (suppliers for parts and services)
export const vendors = pgTable("vendors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(), // Short code like "ACME"
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const spareParts = pgTable("spare_parts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").notNull(),
  sku: text("sku").unique().notNull(),
  barcode: text("barcode"),
  description: text("description"),
  category: text("category", { enum: partCategories }).notNull(),
  vendorId: text("vendor_id").references(() => vendors.id),
  unitCost: real("unit_cost"),
  reorderPoint: integer("reorder_point").notNull().default(0),
  leadTimeDays: integer("lead_time_days"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Stock levels per location
export const inventoryLevels = pgTable(
  "inventory_levels",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    partId: text("part_id")
      .references(() => spareParts.id)
      .notNull(),
    locationId: text("location_id")
      .references(() => locations.id)
      .notNull(),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate inventory levels for same part+location
    partLocationUnique: uniqueIndex("inv_part_location_unique_idx").on(
      table.partId,
      table.locationId
    ),
    // Low stock alerts (quantity below reorder point)
    lowStockIdx: index("inv_low_stock_idx").on(table.quantity, table.partId),
  })
);

// Inventory transactions (stock movements)
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  partId: text("part_id")
    .references(() => spareParts.id)
    .notNull(),
  locationId: text("location_id")
    .references(() => locations.id)
    .notNull(),
  workOrderId: text("work_order_id").references(() => workOrders.id),
  type: text("type", { enum: transactionTypes }).notNull(),
  quantity: integer("quantity").notNull(),
  toLocationId: text("to_location_id").references(() => locations.id),
  reference: text("reference"),
  notes: text("notes"),
  createdById: text("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Parts used on work orders
export const workOrderParts = pgTable("work_order_parts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  workOrderId: text("work_order_id")
    .references(() => workOrders.id)
    .notNull(),
  partId: text("part_id")
    .references(() => spareParts.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: real("unit_cost"),
  addedById: text("added_by_id")
    .references(() => users.id)
    .notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// ============ PHASE 13: LABOR TRACKING ============

// Labor/time logs
export const laborLogs = pgTable(
  "labor_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workOrderId: text("work_order_id")
      .references(() => workOrders.id)
      .notNull(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    durationMinutes: integer("duration_minutes"),
    hourlyRate: real("hourly_rate"),
    isBillable: boolean("is_billable").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Composite index for time tracking aggregations
    workOrderUserIdx: index("labor_wo_user_idx").on(
      table.workOrderId,
      table.userId
    ),
  })
);

// User favorites (bookmarks for quick access)
export const favoriteEntityTypes = ["equipment"] as const;
export type FavoriteEntityType = (typeof favoriteEntityTypes)[number];

export const userFavorites = pgTable(
  "user_favorites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    entityType: text("entity_type").notNull().$type<FavoriteEntityType>(),
    entityId: text("entity_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate favorites
    uniqueFavorite: index("user_favorites_unique_idx").on(
      table.userId,
      table.entityType,
      table.entityId
    ),
    userIdx: index("user_favorites_user_idx").on(table.userId),
  })
);

// Work Order Templates
export const workOrderTemplates = pgTable("work_order_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: workOrderTypes }).notNull(),
  priority: text("priority", { enum: workOrderPriorities })
    .notNull()
    .default("medium"),
  defaultTitle: text("default_title"),
  defaultDescription: text("default_description"),
  defaultAssignedToId: text("default_assigned_to_id").references(
    () => users.id
  ),
  departmentId: text("department_id").references(() => departments.id),
  estimatedMinutes: integer("estimated_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  createdById: text("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// System Settings table for persistent configuration
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedById: text("updated_by_id").references(() => users.id),
});

// Report Templates for Custom Report Builder
export const reportTemplates = pgTable("report_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  description: text("description"),
  config: jsonb("config").notNull(), // Stores layout and widget configuration
  createdById: text("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Report Schedules
export const reportSchedules = pgTable("report_schedules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  templateId: text("template_id")
    .references(() => reportTemplates.id)
    .notNull(),
  frequency: text("frequency", { enum: reportFrequencies }).notNull(),
  recipients: jsonb("recipients").notNull().$type<string[]>().default([]),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: boolean("is_active").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  lastError: text("last_error"),
  failedAt: timestamp("failed_at"),
  retryCount: integer("retry_count").notNull().default(0),
  createdById: text("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// System-wide audit logs
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    entityType: text("entity_type", { enum: entityTypes }).notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(), // "CREATE", "UPDATE", "DELETE", "LOGIN", etc.
    details: jsonb("details"), // JSON description of what changed
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
    user_idx: index("audit_user_idx").on(table.userId),
  })
);

// ============ RELATIONS ============

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
    relationName: "departmentManager",
  }),
  members: many(users, { relationName: "departmentMember" }),
  equipment: many(equipment),
  workOrders: many(workOrders),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  assignedRole: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: "departmentMember",
  }),
  managedDepartment: many(departments, {
    relationName: "departmentManager",
  }),
  ownedEquipment: many(equipment, { relationName: "equipmentOwner" }),
  reportedWorkOrders: many(workOrders, { relationName: "workOrderReporter" }),
  assignedWorkOrders: many(workOrders, { relationName: "workOrderAssignee" }),
  workOrderLogs: many(workOrderLogs),
  attachments: many(attachments),
  notifications: many(notifications),
  equipmentStatusChanges: many(equipmentStatusLogs),
  favorites: many(userFavorites),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "locationHierarchy",
  }),
  children: many(locations, { relationName: "locationHierarchy" }),
  equipment: many(equipment),
}));

export const equipmentCategoriesRelations = relations(
  equipmentCategories,
  ({ many }) => ({
    types: many(equipmentTypes),
  })
);

export const equipmentTypesRelations = relations(
  equipmentTypes,
  ({ one, many }) => ({
    category: one(equipmentCategories, {
      fields: [equipmentTypes.categoryId],
      references: [equipmentCategories.id],
    }),
    equipment: many(equipment),
  })
);

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  location: one(locations, {
    fields: [equipment.locationId],
    references: [locations.id],
  }),
  model: one(equipmentModels, {
    fields: [equipment.modelId],
    references: [equipmentModels.id],
  }),
  type: one(equipmentTypes, {
    fields: [equipment.typeId],
    references: [equipmentTypes.id],
  }),
  responsibleDepartment: one(departments, {
    fields: [equipment.departmentId],
    references: [departments.id],
  }),
  owner: one(users, {
    fields: [equipment.ownerId],
    references: [users.id],
    relationName: "equipmentOwner",
  }),
  parent: one(equipment, {
    fields: [equipment.parentId],
    references: [equipment.id],
    relationName: "equipmentHierarchy",
  }),
  children: many(equipment, {
    relationName: "equipmentHierarchy",
  }),
  workOrders: many(workOrders),
  maintenanceSchedules: many(maintenanceSchedules),
  statusLogs: many(equipmentStatusLogs),
  meters: many(equipmentMeters),
  downtimeLogs: many(downtimeLogs),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [workOrders.equipmentId],
    references: [equipment.id],
  }),
  department: one(departments, {
    fields: [workOrders.departmentId],
    references: [departments.id],
  }),
  reportedBy: one(users, {
    fields: [workOrders.reportedById],
    references: [users.id],
    relationName: "workOrderReporter",
  }),
  assignedTo: one(users, {
    fields: [workOrders.assignedToId],
    references: [users.id],
    relationName: "workOrderAssignee",
  }),
  logs: many(workOrderLogs),
  parts: many(workOrderParts),
}));

export const maintenanceSchedulesRelations = relations(
  maintenanceSchedules,
  ({ one }) => ({
    equipment: one(equipment, {
      fields: [maintenanceSchedules.equipmentId],
      references: [equipment.id],
    }),
  })
);

export const workOrderLogsRelations = relations(workOrderLogs, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderLogs.workOrderId],
    references: [workOrders.id],
  }),
  createdBy: one(users, {
    fields: [workOrderLogs.createdById],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const equipmentStatusLogsRelations = relations(
  equipmentStatusLogs,
  ({ one }) => ({
    equipment: one(equipment, {
      fields: [equipmentStatusLogs.equipmentId],
      references: [equipment.id],
    }),
    changedBy: one(users, {
      fields: [equipmentStatusLogs.changedById],
      references: [users.id],
    }),
  })
);

// Equipment Premium: Meter relations
export const equipmentMetersRelations = relations(
  equipmentMeters,
  ({ one, many }) => ({
    equipment: one(equipment, {
      fields: [equipmentMeters.equipmentId],
      references: [equipment.id],
    }),
    readings: many(meterReadings),
  })
);

export const meterReadingsRelations = relations(meterReadings, ({ one }) => ({
  meter: one(equipmentMeters, {
    fields: [meterReadings.meterId],
    references: [equipmentMeters.id],
  }),
  recordedBy: one(users, {
    fields: [meterReadings.recordedById],
    references: [users.id],
  }),
  workOrder: one(workOrders, {
    fields: [meterReadings.workOrderId],
    references: [workOrders.id],
  }),
}));

// Equipment Premium: Downtime relations
export const downtimeLogsRelations = relations(downtimeLogs, ({ one }) => ({
  equipment: one(equipment, {
    fields: [downtimeLogs.equipmentId],
    references: [equipment.id],
  }),
  reportedBy: one(users, {
    fields: [downtimeLogs.reportedById],
    references: [users.id],
  }),
}));

// Equipment Premium: Prediction relations (Phase 7)
export const equipmentPredictionsRelations = relations(
  equipmentPredictions,
  ({ one }) => ({
    equipment: one(equipment, {
      fields: [equipmentPredictions.equipmentId],
      references: [equipment.id],
    }),
    acknowledgedBy: one(users, {
      fields: [equipmentPredictions.acknowledgedById],
      references: [users.id],
    }),
  })
);

// Equipment Premium: Anomaly relations (Phase 7)
export const meterAnomaliesRelations = relations(meterAnomalies, ({ one }) => ({
  meter: one(equipmentMeters, {
    fields: [meterAnomalies.meterId],
    references: [equipmentMeters.id],
  }),
  reading: one(meterReadings, {
    fields: [meterAnomalies.readingId],
    references: [meterReadings.id],
  }),
  workOrder: one(workOrders, {
    fields: [meterAnomalies.workOrderId],
    references: [workOrders.id],
  }),
  resolvedBy: one(users, {
    fields: [meterAnomalies.resolvedById],
    references: [users.id],
  }),
}));

export const equipmentModelsRelations = relations(
  equipmentModels,
  ({ many }) => ({
    equipment: many(equipment),
    bom: many(equipmentBoms),
  })
);

export const equipmentBomsRelations = relations(equipmentBoms, ({ one }) => ({
  model: one(equipmentModels, {
    fields: [equipmentBoms.modelId],
    references: [equipmentModels.id],
  }),
  part: one(spareParts, {
    fields: [equipmentBoms.partId],
    references: [spareParts.id],
  }),
}));

// Phase 10: Checklist relations
export const maintenanceChecklistsRelations = relations(
  maintenanceChecklists,
  ({ one, many }) => ({
    schedule: one(maintenanceSchedules, {
      fields: [maintenanceChecklists.scheduleId],
      references: [maintenanceSchedules.id],
    }),
    completions: many(checklistCompletions),
  })
);

export const checklistCompletionsRelations = relations(
  checklistCompletions,
  ({ one }) => ({
    checklist: one(maintenanceChecklists, {
      fields: [checklistCompletions.checklistId],
      references: [maintenanceChecklists.id],
    }),
    workOrder: one(workOrders, {
      fields: [checklistCompletions.workOrderId],
      references: [workOrders.id],
    }),
    completedBy: one(users, {
      fields: [checklistCompletions.completedById],
      references: [users.id],
    }),
  })
);

// Phase 12: Inventory relations
export const vendorsRelations = relations(vendors, ({ many }) => ({
  parts: many(spareParts),
}));

export const sparePartsRelations = relations(spareParts, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [spareParts.vendorId],
    references: [vendors.id],
  }),
  inventoryLevels: many(inventoryLevels),
  transactions: many(inventoryTransactions),
  workOrderParts: many(workOrderParts),
  usedInModels: many(equipmentBoms),
}));

export const inventoryLevelsRelations = relations(
  inventoryLevels,
  ({ one }) => ({
    part: one(spareParts, {
      fields: [inventoryLevels.partId],
      references: [spareParts.id],
    }),
    location: one(locations, {
      fields: [inventoryLevels.locationId],
      references: [locations.id],
    }),
  })
);

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    part: one(spareParts, {
      fields: [inventoryTransactions.partId],
      references: [spareParts.id],
    }),
    location: one(locations, {
      fields: [inventoryTransactions.locationId],
      references: [locations.id],
    }),
    workOrder: one(workOrders, {
      fields: [inventoryTransactions.workOrderId],
      references: [workOrders.id],
    }),
    toLocation: one(locations, {
      fields: [inventoryTransactions.toLocationId],
      references: [locations.id],
    }),
    createdBy: one(users, {
      fields: [inventoryTransactions.createdById],
      references: [users.id],
    }),
  })
);

export const workOrderPartsRelations = relations(workOrderParts, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderParts.workOrderId],
    references: [workOrders.id],
  }),
  part: one(spareParts, {
    fields: [workOrderParts.partId],
    references: [spareParts.id],
  }),
  addedBy: one(users, {
    fields: [workOrderParts.addedById],
    references: [users.id],
  }),
}));

// Phase 13: Labor relations
export const laborLogsRelations = relations(laborLogs, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [laborLogs.workOrderId],
    references: [workOrders.id],
  }),
  user: one(users, {
    fields: [laborLogs.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));

// Work Order Templates relations
export const workOrderTemplatesRelations = relations(
  workOrderTemplates,
  ({ one }) => ({
    defaultAssignedTo: one(users, {
      fields: [workOrderTemplates.defaultAssignedToId],
      references: [users.id],
      relationName: "templateDefaultAssignee",
    }),
    department: one(departments, {
      fields: [workOrderTemplates.departmentId],
      references: [departments.id],
    }),
    createdBy: one(users, {
      fields: [workOrderTemplates.createdById],
      references: [users.id],
      relationName: "templateCreator",
    }),
  })
);

// Report Templates relations
export const reportTemplatesRelations = relations(
  reportTemplates,
  ({ one, many }) => ({
    createdBy: one(users, {
      fields: [reportTemplates.createdById],
      references: [users.id],
    }),
    schedules: many(reportSchedules),
  })
);

// Report Schedules relations
export const reportSchedulesRelations = relations(
  reportSchedules,
  ({ one }) => ({
    template: one(reportTemplates, {
      fields: [reportSchedules.templateId],
      references: [reportTemplates.id],
    }),
    createdBy: one(users, {
      fields: [reportSchedules.createdById],
      references: [users.id],
    }),
  })
);

// ============ TYPE EXPORTS ============

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type EquipmentCategory = typeof equipmentCategories.$inferSelect;
export type NewEquipmentCategory = typeof equipmentCategories.$inferInsert;

export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type NewEquipmentType = typeof equipmentTypes.$inferInsert;

export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;

export type EquipmentModel = typeof equipmentModels.$inferSelect;
export type NewEquipmentModel = typeof equipmentModels.$inferInsert;

export type EquipmentBom = typeof equipmentBoms.$inferSelect;
export type NewEquipmentBom = typeof equipmentBoms.$inferInsert;

export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type NewMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

export type WorkOrderLog = typeof workOrderLogs.$inferSelect;
export type NewWorkOrderLog = typeof workOrderLogs.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type EquipmentStatusLog = typeof equipmentStatusLogs.$inferSelect;
export type NewEquipmentStatusLog = typeof equipmentStatusLogs.$inferInsert;

// Equipment Premium: Meter types
export type EquipmentMeter = typeof equipmentMeters.$inferSelect;
export type NewEquipmentMeter = typeof equipmentMeters.$inferInsert;

export type MeterReading = typeof meterReadings.$inferSelect;
export type NewMeterReading = typeof meterReadings.$inferInsert;

// Equipment Premium: Downtime types
export type DowntimeLog = typeof downtimeLogs.$inferSelect;
export type NewDowntimeLog = typeof downtimeLogs.$inferInsert;

// Phase 10: Checklist types
export type MaintenanceChecklist = typeof maintenanceChecklists.$inferSelect;
export type NewMaintenanceChecklist = typeof maintenanceChecklists.$inferInsert;

export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type NewChecklistCompletion = typeof checklistCompletions.$inferInsert;

/// Phase 12: Inventory types
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type SparePart = typeof spareParts.$inferSelect;
export type NewSparePart = typeof spareParts.$inferInsert;

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevels.$inferInsert;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;

export type WorkOrderPart = typeof workOrderParts.$inferSelect;
export type NewWorkOrderPart = typeof workOrderParts.$inferInsert;

// Phase 13: Labor types
export type LaborLog = typeof laborLogs.$inferSelect;
export type NewLaborLog = typeof laborLogs.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Phase 7: Predictive Maintenance types
export type EquipmentPrediction = typeof equipmentPredictions.$inferSelect;
export type NewEquipmentPrediction = typeof equipmentPredictions.$inferInsert;

export type MeterAnomaly = typeof meterAnomalies.$inferSelect;
export type NewMeterAnomaly = typeof meterAnomalies.$inferInsert;

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;

// Work Order Templates types
export type WorkOrderTemplate = typeof workOrderTemplates.$inferSelect;
export type NewWorkOrderTemplate = typeof workOrderTemplates.$inferInsert;

// Report types
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type NewReportTemplate = typeof reportTemplates.$inferInsert;

export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type NewReportSchedule = typeof reportSchedules.$inferInsert;

// System Settings types
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

// SMTP configuration for email sending
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string; // encrypted
  fromAddress: string;
  fromName: string;
}

// System settings interface for type-safe access
export interface SystemSettingsConfig {
  sla: {
    critical: number; // hours
    high: number;
    medium: number;
    low: number;
  };
  session: {
    idleTimeout: number; // hours
    maxDuration: number; // hours
  };
  notifications: {
    emailEnabled: boolean;
    escalationAlerts: boolean;
    dailySummary: boolean;
  };
  smtp_config?: SmtpConfig;
}
