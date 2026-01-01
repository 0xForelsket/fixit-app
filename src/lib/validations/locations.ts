import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code is too long")
    .regex(
      /^[A-Z0-9-]+$/,
      "Code can only contain uppercase letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .nullable(),
  parentId: z.string().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateLocationSchema = z.object({
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
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .nullable(),
  parentId: z.string().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
