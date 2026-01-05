import { z } from "zod";

export const equipmentStatusSchema = z.enum([
  "operational",
  "down",
  "maintenance",
]);

// Meter types enum
export const meterTypeSchema = z.enum([
  "hours",
  "miles",
  "kilometers",
  "cycles",
  "units",
]);

// Downtime reason codes enum
export const downtimeReasonSchema = z.enum([
  "mechanical_failure",
  "electrical_failure",
  "no_operator",
  "no_materials",
  "planned_maintenance",
  "changeover",
  "other",
]);

// Phase 1.1 - Specifications schema
export const specificationsSchema = z.object({
  serialNumber: z
    .string()
    .max(100, "Serial number is too long")
    .optional()
    .nullable(),
  manufacturer: z
    .string()
    .max(100, "Manufacturer name is too long")
    .optional()
    .nullable(),
  modelYear: z.coerce
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(2100, "Year must be 2100 or earlier")
    .optional()
    .nullable(),
  warrantyExpiration: z.coerce.date().optional().nullable(),
});

// Phase 1.2 - Financials schema
// Note: purchasePrice and residualValue are stored as text in DB for precision
export const financialsSchema = z.object({
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: z
    .string()
    .refine(
      (val) => !val || !Number.isNaN(Number.parseFloat(val)),
      "Must be a valid number"
    )
    .refine(
      (val) => !val || Number.parseFloat(val) >= 0,
      "Price cannot be negative"
    )
    .optional()
    .nullable(),
  residualValue: z
    .string()
    .refine(
      (val) => !val || !Number.isNaN(Number.parseFloat(val)),
      "Must be a valid number"
    )
    .refine(
      (val) => !val || Number.parseFloat(val) >= 0,
      "Residual value cannot be negative"
    )
    .optional()
    .nullable(),
  usefulLifeYears: z.coerce
    .number()
    .int()
    .min(1, "Useful life must be at least 1 year")
    .max(100, "Useful life cannot exceed 100 years")
    .optional()
    .nullable(),
});

// Phase 4 - Meter schema
export const meterSchema = z.object({
  name: z
    .string()
    .min(1, "Meter name is required")
    .max(100, "Name is too long"),
  type: meterTypeSchema,
  unit: z.string().min(1, "Unit is required").max(20, "Unit is too long"),
  currentReading: z.coerce
    .number()
    .min(0, "Reading cannot be negative")
    .optional(),
});

// Meter reading schema
export const meterReadingSchema = z.object({
  meterId: z.string().min(1, "Meter is required"),
  reading: z.coerce.number().min(0, "Reading cannot be negative"),
  notes: z.string().max(500, "Notes too long").optional(),
  workOrderId: z.string().min(1).optional(),
});

// Downtime log schema
export const downtimeLogSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  reasonCode: downtimeReasonSchema,
  notes: z.string().max(1000, "Notes too long").optional(),
});

// Base equipment fields
const baseEquipmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code is too long")
    .regex(
      /^[A-Z0-9-]+$/,
      "Code can only contain uppercase letters, numbers, and hyphens"
    ),
  locationId: z.string().min(1, "Location is required"),
  ownerId: z.string().min(1).optional().nullable(),
  departmentId: z.string().min(1, "Responsible department is required"),
  typeId: z.string().min(1).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
  status: equipmentStatusSchema.default("operational"),
});

// Create equipment schema (includes all premium fields)
export const createEquipmentSchema = baseEquipmentSchema
  .merge(specificationsSchema)
  .merge(financialsSchema);

// Update equipment schema (all fields optional)
export const updateEquipmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code is too long")
    .regex(
      /^[A-Z0-9-]+$/,
      "Code can only contain uppercase letters, numbers, and hyphens"
    )
    .optional(),
  locationId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),
  typeId: z.string().min(1).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
  status: equipmentStatusSchema.optional(),
  // Phase 1.1 - Specifications
  serialNumber: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  modelYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  warrantyExpiration: z.coerce.date().optional().nullable(),
  // Phase 1.2 - Financials
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: z.string().optional().nullable(),
  residualValue: z.string().optional().nullable(),
  usefulLifeYears: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .nullable(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type MeterInput = z.infer<typeof meterSchema>;
export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
export type DowntimeLogInput = z.infer<typeof downtimeLogSchema>;
