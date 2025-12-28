import { equipmentStatuses, partCategories } from "@/db/schema";
import { z } from "zod";

export const duplicateStrategies = ["skip", "update", "error"] as const;
export type DuplicateStrategy = (typeof duplicateStrategies)[number];

export const importOptionsSchema = z.object({
  duplicateStrategy: z.enum(duplicateStrategies).default("skip"),
  validateOnly: z.boolean().default(false),
});

export type ImportOptions = z.infer<typeof importOptionsSchema>;

export const equipmentImportRowSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1, "Name is required").max(100),
  location_code: z.string().min(1, "Location code is required"),
  model_name: z.string().optional(),
  type_code: z.string().optional(),
  owner_employee_id: z.string().optional(),
  status: z.enum(equipmentStatuses).default("operational"),
});

export type EquipmentImportRow = z.infer<typeof equipmentImportRowSchema>;

export const equipmentImportFieldDefinitions = [
  {
    field: "code",
    aliases: ["equipment_code", "eq_code", "asset_code"],
    required: true,
  },
  {
    field: "name",
    aliases: ["equipment_name", "eq_name", "asset_name", "description"],
    required: true,
  },
  {
    field: "location_code",
    aliases: ["location", "loc_code", "site"],
    required: true,
  },
  {
    field: "model_name",
    aliases: ["model", "equipment_model"],
    required: false,
  },
  {
    field: "type_code",
    aliases: ["type", "equipment_type", "category"],
    required: false,
  },
  {
    field: "owner_employee_id",
    aliases: ["owner", "owner_id", "responsible"],
    required: false,
  },
  { field: "status", aliases: ["equipment_status", "state"], required: false },
] as const;

export interface ImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

// ============ SPARE PARTS IMPORT ============

export const sparePartImportRowSchema = z.object({
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50)
    .transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(partCategories),
  description: z.string().optional(),
  barcode: z.string().max(50).optional(),
  unit_cost: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseFloat(v) : undefined))
    .pipe(z.number().positive().optional()),
  reorder_point: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : 0))
    .pipe(z.number().int().min(0)),
  lead_time_days: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
});

export type SparePartImportRow = z.infer<typeof sparePartImportRowSchema>;

export const sparePartImportFieldDefinitions = [
  {
    field: "sku",
    aliases: ["part_number", "part_no", "pn", "item_code"],
    required: true,
  },
  {
    field: "name",
    aliases: ["part_name", "description", "item_name"],
    required: true,
  },
  {
    field: "category",
    aliases: ["part_category", "type", "cat"],
    required: true,
  },
  {
    field: "description",
    aliases: ["desc", "notes", "details"],
    required: false,
  },
  {
    field: "barcode",
    aliases: ["upc", "ean", "bar_code"],
    required: false,
  },
  {
    field: "unit_cost",
    aliases: ["cost", "price", "unit_price"],
    required: false,
  },
  {
    field: "reorder_point",
    aliases: ["reorder_level", "min_qty", "minimum_quantity"],
    required: false,
  },
  {
    field: "lead_time_days",
    aliases: ["lead_time", "delivery_days"],
    required: false,
  },
] as const;

// ============ LOCATIONS IMPORT ============

export const locationImportRowSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  parent_code: z.string().optional(),
});

export type LocationImportRow = z.infer<typeof locationImportRowSchema>;

export const locationImportFieldDefinitions = [
  {
    field: "code",
    aliases: ["location_code", "loc_code", "site_code"],
    required: true,
  },
  {
    field: "name",
    aliases: ["location_name", "site_name", "area"],
    required: true,
  },
  {
    field: "description",
    aliases: ["desc", "notes", "details"],
    required: false,
  },
  {
    field: "parent_code",
    aliases: ["parent", "parent_location", "parent_site"],
    required: false,
  },
] as const;

// ============ USERS IMPORT ============

export const userImportRowSchema = z.object({
  employee_id: z
    .string()
    .min(1, "Employee ID is required")
    .max(20)
    .transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  pin: z
    .string()
    .min(4, "PIN must be at least 4 digits")
    .max(8)
    .regex(/^\d+$/, "PIN must contain only digits"),
  role_name: z.string().min(1, "Role is required"),
  hourly_rate: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseFloat(v) : undefined))
    .pipe(z.number().positive().optional()),
});

export type UserImportRow = z.infer<typeof userImportRowSchema>;

export const userImportFieldDefinitions = [
  {
    field: "employee_id",
    aliases: ["emp_id", "employee_code", "id"],
    required: true,
  },
  {
    field: "name",
    aliases: ["full_name", "employee_name", "username"],
    required: true,
  },
  {
    field: "email",
    aliases: ["email_address", "e-mail"],
    required: false,
  },
  {
    field: "pin",
    aliases: ["password", "passcode", "access_code"],
    required: true,
  },
  {
    field: "role_name",
    aliases: ["role", "user_role", "access_level"],
    required: true,
  },
  {
    field: "hourly_rate",
    aliases: ["rate", "wage", "pay_rate"],
    required: false,
  },
] as const;
