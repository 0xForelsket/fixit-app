import { z } from "zod";

export const machineStatusSchema = z.enum([
  "operational",
  "down",
  "maintenance",
]);

export const createMachineSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code is too long")
    .regex(
      /^[A-Z0-9-]+$/,
      "Code can only contain uppercase letters, numbers, and hyphens"
    ),
  locationId: z.number().int().positive("Location is required"),
  ownerId: z.number().int().positive().optional().nullable(),
  status: machineStatusSchema.default("operational"),
});

export const updateMachineSchema = z.object({
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
  locationId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional().nullable(),
  status: machineStatusSchema.optional(),
});

export type CreateMachineInput = z.infer<typeof createMachineSchema>;
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>;
