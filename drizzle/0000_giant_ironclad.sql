CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`type` text NOT NULL,
	`filename` text NOT NULL,
	`s3_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`uploaded_by_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `checklist_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`checklist_id` integer NOT NULL,
	`work_order_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_by_id` integer,
	`notes` text,
	`completed_at` integer,
	FOREIGN KEY (`checklist_id`) REFERENCES `maintenance_checklists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`manager_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_name_unique` ON `departments` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`model_id` integer,
	`type_id` integer,
	`location_id` integer NOT NULL,
	`owner_id` integer,
	`department_id` integer,
	`parent_id` integer,
	`status` text DEFAULT 'operational' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `equipment_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`type_id`) REFERENCES `equipment_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_code_unique` ON `equipment` (`code`);--> statement-breakpoint
CREATE INDEX `eq_code_idx` ON `equipment` (`code`);--> statement-breakpoint
CREATE INDEX `eq_status_idx` ON `equipment` (`status`);--> statement-breakpoint
CREATE INDEX `eq_dept_idx` ON `equipment` (`department_id`);--> statement-breakpoint
CREATE TABLE `equipment_boms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`quantity_required` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `equipment_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`part_id`) REFERENCES `spare_parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `equipment_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`manufacturer` text,
	`description` text,
	`manual_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `equipment_status_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`old_status` text NOT NULL,
	`new_status` text NOT NULL,
	`changed_by_id` integer,
	`changed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	FOREIGN KEY (`category_id`) REFERENCES `equipment_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_types_code_unique` ON `equipment_types` (`code`);--> statement-breakpoint
CREATE TABLE `inventory_levels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`part_id` integer NOT NULL,
	`location_id` integer NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`part_id`) REFERENCES `spare_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`part_id` integer NOT NULL,
	`location_id` integer NOT NULL,
	`work_order_id` integer,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`to_location_id` integer,
	`reference` text,
	`notes` text,
	`created_by_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`part_id`) REFERENCES `spare_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `labor_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`duration_minutes` integer,
	`hourly_rate` real,
	`is_billable` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `labor_wo_user_idx` ON `labor_logs` (`work_order_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`parent_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_code_unique` ON `locations` (`code`);--> statement-breakpoint
CREATE TABLE `maintenance_checklists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`step_number` integer NOT NULL,
	`description` text NOT NULL,
	`is_required` integer DEFAULT true NOT NULL,
	`estimated_minutes` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `maintenance_schedules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`frequency_days` integer NOT NULL,
	`last_generated` integer,
	`next_due` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notif_user_unread_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text DEFAULT '[]' NOT NULL,
	`is_system_role` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `spare_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`description` text,
	`category` text NOT NULL,
	`unit_cost` real,
	`reorder_point` integer DEFAULT 0 NOT NULL,
	`lead_time_days` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spare_parts_sku_unique` ON `spare_parts` (`sku`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`pin` text NOT NULL,
	`role_id` integer,
	`department_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`hourly_rate` real,
	`preferences` text DEFAULT '{"theme":"system","density":"comfortable","notifications":{"email":true}}',
	`failed_login_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_employee_id_unique` ON `users` (`employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `work_order_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text NOT NULL,
	`created_by_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unit_cost` real,
	`added_by_id` integer NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`part_id`) REFERENCES `spare_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`added_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`type` text NOT NULL,
	`reported_by_id` integer NOT NULL,
	`assigned_to_id` integer,
	`department_id` integer,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution_notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`resolved_at` integer,
	`escalated_at` integer,
	`due_by` integer,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `wo_status_idx` ON `work_orders` (`status`);--> statement-breakpoint
CREATE INDEX `wo_priority_idx` ON `work_orders` (`priority`);--> statement-breakpoint
CREATE INDEX `wo_due_by_idx` ON `work_orders` (`due_by`);--> statement-breakpoint
CREATE INDEX `wo_assigned_to_idx` ON `work_orders` (`assigned_to_id`);--> statement-breakpoint
CREATE INDEX `wo_assigned_status_idx` ON `work_orders` (`assigned_to_id`,`status`);--> statement-breakpoint
CREATE INDEX `wo_dept_status_idx` ON `work_orders` (`department_id`,`status`);--> statement-breakpoint
CREATE INDEX `wo_equipment_history_idx` ON `work_orders` (`equipment_id`,`created_at`);