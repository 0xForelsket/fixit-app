import { z } from "zod";

export const equipmentStatusSchema = z.enum([
  "operational",
  "down",
  "maintenance",
]);

export const createEquipmentSchema = z.object({
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
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
