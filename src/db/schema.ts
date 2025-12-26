import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Enums as const objects for type safety
export const userRoles = ["operator", "tech", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const equipmentStatuses = [
  "operational",
  "down",
  "maintenance",
] as const;
export type EquipmentStatus = (typeof equipmentStatuses)[number];

export const ticketTypes = [
  "breakdown",
  "maintenance",
  "calibration",
  "safety",
  "upgrade",
] as const;
export type TicketType = (typeof ticketTypes)[number];

export const ticketPriorities = ["low", "medium", "high", "critical"] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export const ticketStatuses = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const scheduleTypes = ["maintenance", "calibration"] as const;
export type ScheduleType = (typeof scheduleTypes)[number];

export const ticketLogActions = [
  "status_change",
  "comment",
  "assignment",
] as const;
export type TicketLogAction = (typeof ticketLogActions)[number];

export const entityTypes = ["user", "equipment", "ticket", "location"] as const;
export type EntityType = (typeof entityTypes)[number];

export const attachmentTypes = [
  "avatar",
  "photo",
  "document",
  "before",
  "after",
] as const;
export type AttachmentType = (typeof attachmentTypes)[number];

export const notificationTypes = [
  "ticket_created",
  "ticket_assigned",
  "ticket_escalated",
  "maintenance_due",
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

// ============ TABLES ============

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  description: text("description"),
  permissions: text("permissions", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .default([]),
  isSystemRole: integer("is_system_role", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  pin: text("pin").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("operator"),
  roleId: integer("role_id").references(() => roles.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  hourlyRate: real("hourly_rate"), // For labor cost tracking
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Locations table (hierarchical)
export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  parentId: integer("parent_id"), // Self-reference handled in relations
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// SAP-style Equipment Categories (e.g., Mechanical, Electrical)
export const equipmentCategories = sqliteTable("equipment_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // e.g., "M"
  label: text("label").notNull(), // e.g., "Mechanical"
  description: text("description"),
});

// SAP-style Object Types (e.g., Pump, Motor)
export const equipmentTypes = sqliteTable("equipment_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .references(() => equipmentCategories.id)
    .notNull(),
  name: text("name").notNull(), // e.g., "Pump"
  code: text("code").unique().notNull(), // e.g., "PMP"
  description: text("description"),
});

// Equipment Models table
export const equipmentModels = sqliteTable("equipment_models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  description: text("description"),
  manualUrl: text("manual_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Equipment table (formerly Equipment)
export const equipment = sqliteTable("equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").unique().notNull(), // For QR codes
  modelId: integer("model_id").references(() => equipmentModels.id),
  typeId: integer("type_id").references(() => equipmentTypes.id),
  locationId: integer("location_id")
    .references(() => locations.id)
    .notNull(),
  ownerId: integer("owner_id").references(() => users.id), // Owner
  status: text("status", { enum: equipmentStatuses })
    .notNull()
    .default("operational"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Tickets table
export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  equipmentId: integer("equipment_id")
    .references(() => equipment.id)
    .notNull(),
  type: text("type", { enum: ticketTypes }).notNull(),
  reportedById: integer("reported_by_id")
    .references(() => users.id)
    .notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority", { enum: ticketPriorities })
    .notNull()
    .default("medium"),
  status: text("status", { enum: ticketStatuses }).notNull().default("open"),
  resolutionNotes: text("resolution_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  escalatedAt: integer("escalated_at", { mode: "timestamp" }),
  dueBy: integer("due_by", { mode: "timestamp" }),
});

// Maintenance schedules table
export const maintenanceSchedules = sqliteTable("maintenance_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  equipmentId: integer("equipment_id")
    .references(() => equipment.id)
    .notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: scheduleTypes }).notNull(),
  frequencyDays: integer("frequency_days").notNull(),
  lastGenerated: integer("last_generated", { mode: "timestamp" }),
  nextDue: integer("next_due", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Ticket logs table (audit trail)
export const ticketLogs = sqliteTable("ticket_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  action: text("action", { enum: ticketLogActions }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Attachments table (polymorphic)
export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type", { enum: entityTypes }).notNull(),
  entityId: integer("entity_id").notNull(),
  type: text("type", { enum: attachmentTypes }).notNull(),
  filename: text("filename").notNull(),
  s3Key: text("s3_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedById: integer("uploaded_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Notifications table
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type", { enum: notificationTypes }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Equipment status logs table (for downtime tracking)
export const equipmentStatusLogs = sqliteTable("equipment_status_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  equipmentId: integer("equipment_id")
    .references(() => equipment.id)
    .notNull(),
  oldStatus: text("old_status", { enum: equipmentStatuses }).notNull(),
  newStatus: text("new_status", { enum: equipmentStatuses }).notNull(),
  changedById: integer("changed_by_id").references(() => users.id),
  changedAt: integer("changed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Bill of Materials (BOM) linking models to parts
export const equipmentBoms = sqliteTable("equipment_boms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelId: integer("model_id")
    .references(() => equipmentModels.id)
    .notNull(),
  partId: integer("part_id")
    .references(() => spareParts.id)
    .notNull(),
  quantityRequired: integer("quantity_required").notNull().default(1),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============ PHASE 10: MAINTENANCE CHECKLISTS ============

// Checklist templates linked to maintenance schedules
export const maintenanceChecklists = sqliteTable("maintenance_checklists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scheduleId: integer("schedule_id")
    .references(() => maintenanceSchedules.id)
    .notNull(),
  stepNumber: integer("step_number").notNull(),
  description: text("description").notNull(),
  isRequired: integer("is_required", { mode: "boolean" })
    .notNull()
    .default(true),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Completed checklist items per ticket
export const checklistCompletions = sqliteTable("checklist_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checklistId: integer("checklist_id")
    .references(() => maintenanceChecklists.id)
    .notNull(),
  ticketId: integer("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  status: text("status", { enum: checklistItemStatuses })
    .notNull()
    .default("pending"),
  completedById: integer("completed_by_id").references(() => users.id),
  notes: text("notes"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// ============ PHASE 12: INVENTORY MANAGEMENT ============

// Spare parts catalog
export const spareParts = sqliteTable("spare_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").unique().notNull(),
  barcode: text("barcode"),
  description: text("description"),
  category: text("category", { enum: partCategories }).notNull(),
  unitCost: real("unit_cost"),
  reorderPoint: integer("reorder_point").notNull().default(0),
  leadTimeDays: integer("lead_time_days"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Stock levels per location
export const inventoryLevels = sqliteTable("inventory_levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partId: integer("part_id")
    .references(() => spareParts.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => locations.id)
    .notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Inventory transactions (stock movements)
export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partId: integer("part_id")
    .references(() => spareParts.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => locations.id)
    .notNull(),
  ticketId: integer("ticket_id").references(() => tickets.id),
  type: text("type", { enum: transactionTypes }).notNull(),
  quantity: integer("quantity").notNull(),
  toLocationId: integer("to_location_id").references(() => locations.id),
  reference: text("reference"),
  notes: text("notes"),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Parts used on tickets
export const ticketParts = sqliteTable("ticket_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  partId: integer("part_id")
    .references(() => spareParts.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: real("unit_cost"),
  addedById: integer("added_by_id")
    .references(() => users.id)
    .notNull(),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============ PHASE 13: LABOR TRACKING ============

// Labor/time logs
export const laborLogs = sqliteTable("labor_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  durationMinutes: integer("duration_minutes"),
  hourlyRate: real("hourly_rate"),
  isBillable: integer("is_billable", { mode: "boolean" })
    .notNull()
    .default(true),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============ RELATIONS ============

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  ownedEquipment: many(equipment, { relationName: "equipmentOwner" }),
  reportedTickets: many(tickets, { relationName: "ticketReporter" }),
  assignedTickets: many(tickets, { relationName: "ticketAssignee" }),
  ticketLogs: many(ticketLogs),
  attachments: many(attachments),
  notifications: many(notifications),
  equipmentStatusChanges: many(equipmentStatusLogs),
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
  owner: one(users, {
    fields: [equipment.ownerId],
    references: [users.id],
    relationName: "equipmentOwner",
  }),
  tickets: many(tickets),
  maintenanceSchedules: many(maintenanceSchedules),
  statusLogs: many(equipmentStatusLogs),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [tickets.equipmentId],
    references: [equipment.id],
  }),
  reportedBy: one(users, {
    fields: [tickets.reportedById],
    references: [users.id],
    relationName: "ticketReporter",
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
    relationName: "ticketAssignee",
  }),
  logs: many(ticketLogs),
  parts: many(ticketParts),
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

export const ticketLogsRelations = relations(ticketLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketLogs.ticketId],
    references: [tickets.id],
  }),
  createdBy: one(users, {
    fields: [ticketLogs.createdById],
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
    ticket: one(tickets, {
      fields: [checklistCompletions.ticketId],
      references: [tickets.id],
    }),
    completedBy: one(users, {
      fields: [checklistCompletions.completedById],
      references: [users.id],
    }),
  })
);

// Phase 12: Inventory relations
export const sparePartsRelations = relations(spareParts, ({ many }) => ({
  inventoryLevels: many(inventoryLevels),
  transactions: many(inventoryTransactions),
  ticketParts: many(ticketParts),
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
    ticket: one(tickets, {
      fields: [inventoryTransactions.ticketId],
      references: [tickets.id],
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

export const ticketPartsRelations = relations(ticketParts, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketParts.ticketId],
    references: [tickets.id],
  }),
  part: one(spareParts, {
    fields: [ticketParts.partId],
    references: [spareParts.id],
  }),
  addedBy: one(users, {
    fields: [ticketParts.addedById],
    references: [users.id],
  }),
}));

// Phase 13: Labor relations
export const laborLogsRelations = relations(laborLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [laborLogs.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [laborLogs.userId],
    references: [users.id],
  }),
}));

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

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type NewMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

export type TicketLog = typeof ticketLogs.$inferSelect;
export type NewTicketLog = typeof ticketLogs.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type EquipmentStatusLog = typeof equipmentStatusLogs.$inferSelect;
export type NewEquipmentStatusLog = typeof equipmentStatusLogs.$inferInsert;

// Phase 10: Checklist types
export type MaintenanceChecklist = typeof maintenanceChecklists.$inferSelect;
export type NewMaintenanceChecklist = typeof maintenanceChecklists.$inferInsert;

export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type NewChecklistCompletion = typeof checklistCompletions.$inferInsert;

// Phase 12: Inventory types
export type SparePart = typeof spareParts.$inferSelect;
export type NewSparePart = typeof spareParts.$inferInsert;

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevels.$inferInsert;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;

export type TicketPart = typeof ticketParts.$inferSelect;
export type NewTicketPart = typeof ticketParts.$inferInsert;

// Phase 13: Labor types
export type LaborLog = typeof laborLogs.$inferSelect;
export type NewLaborLog = typeof laborLogs.$inferInsert;
