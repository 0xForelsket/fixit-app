import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const allPermissions = Object.values(PERMISSIONS);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Name must be lowercase alphanumeric with hyphens/underscores only"
    ),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required")
    .refine(
      (perms) =>
        perms.every((p) =>
          allPermissions.includes(p as (typeof allPermissions)[number])
        ),
      { message: "Invalid permission value" }
    ),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Name must be lowercase alphanumeric with hyphens/underscores only"
    )
    .optional(),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required")
    .refine(
      (perms) =>
        perms.every((p) =>
          allPermissions.includes(p as (typeof allPermissions)[number])
        ),
      { message: "Invalid permission value" }
    )
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
