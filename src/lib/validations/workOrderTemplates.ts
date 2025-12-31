import { z } from "zod";
import { workOrderPrioritySchema, workOrderTypeSchema } from "./workOrders";

export const createWorkOrderTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  type: workOrderTypeSchema,
  priority: workOrderPrioritySchema.default("medium"),
  defaultTitle: z
    .string()
    .max(200, "Default title must be at most 200 characters")
    .optional()
    .nullable(),
  defaultDescription: z
    .string()
    .max(5000, "Default description must be at most 5000 characters")
    .optional()
    .nullable(),
  defaultAssignedToId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateWorkOrderTemplateSchema = createWorkOrderTemplateSchema;

export type CreateWorkOrderTemplateInput = z.infer<
  typeof createWorkOrderTemplateSchema
>;
export type UpdateWorkOrderTemplateInput = z.infer<
  typeof updateWorkOrderTemplateSchema
>;
