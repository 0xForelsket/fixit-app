import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Enums as const objects for type safety
export const userRoles = ["operator", "tech", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const machineStatuses = ["operational", "down", "maintenance"] as const;
export type MachineStatus = (typeof machineStatuses)[number];

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

export const entityTypes = ["user", "machine", "ticket", "location"] as const;
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

// ============ TABLES ============

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  pin: text("pin").notNull(), // Hashed PIN
  role: text("role", { enum: userRoles }).notNull().default("operator"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
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

// Machines table
export const machines = sqliteTable("machines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").unique().notNull(), // For QR codes
  locationId: integer("location_id")
    .references(() => locations.id)
    .notNull(),
  ownerId: integer("owner_id").references(() => users.id), // 5S owner
  status: text("status", { enum: machineStatuses })
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
  machineId: integer("machine_id")
    .references(() => machines.id)
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
  machineId: integer("machine_id")
    .references(() => machines.id)
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

// Machine status logs table (for downtime tracking)
export const machineStatusLogs = sqliteTable("machine_status_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  machineId: integer("machine_id")
    .references(() => machines.id)
    .notNull(),
  oldStatus: text("old_status", { enum: machineStatuses }).notNull(),
  newStatus: text("new_status", { enum: machineStatuses }).notNull(),
  changedById: integer("changed_by_id").references(() => users.id),
  changedAt: integer("changed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  ownedMachines: many(machines, { relationName: "machineOwner" }),
  reportedTickets: many(tickets, { relationName: "ticketReporter" }),
  assignedTickets: many(tickets, { relationName: "ticketAssignee" }),
  ticketLogs: many(ticketLogs),
  attachments: many(attachments),
  notifications: many(notifications),
  machineStatusChanges: many(machineStatusLogs),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "locationHierarchy",
  }),
  children: many(locations, { relationName: "locationHierarchy" }),
  machines: many(machines),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  location: one(locations, {
    fields: [machines.locationId],
    references: [locations.id],
  }),
  owner: one(users, {
    fields: [machines.ownerId],
    references: [users.id],
    relationName: "machineOwner",
  }),
  tickets: many(tickets),
  maintenanceSchedules: many(maintenanceSchedules),
  statusLogs: many(machineStatusLogs),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  machine: one(machines, {
    fields: [tickets.machineId],
    references: [machines.id],
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
}));

export const maintenanceSchedulesRelations = relations(
  maintenanceSchedules,
  ({ one }) => ({
    machine: one(machines, {
      fields: [maintenanceSchedules.machineId],
      references: [machines.id],
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

export const machineStatusLogsRelations = relations(
  machineStatusLogs,
  ({ one }) => ({
    machine: one(machines, {
      fields: [machineStatusLogs.machineId],
      references: [machines.id],
    }),
    changedBy: one(users, {
      fields: [machineStatusLogs.changedById],
      references: [users.id],
    }),
  })
);

// ============ TYPE EXPORTS ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type Machine = typeof machines.$inferSelect;
export type NewMachine = typeof machines.$inferInsert;

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

export type MachineStatusLog = typeof machineStatusLogs.$inferSelect;
export type NewMachineStatusLog = typeof machineStatusLogs.$inferInsert;
