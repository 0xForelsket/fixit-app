import { z } from "zod";

export const scheduleTypeSchema = z.enum(["maintenance", "calibration"]);

export const checklistItemSchema = z.object({
  id: z.string().optional(),
  stepNumber: z.number(),
  description: z.string(),
  isRequired: z.boolean(),
  estimatedMinutes: z.coerce.number().nullable(),
});

export const insertMaintenanceScheduleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  equipmentId: z.string().min(1, "Equipment is required"), // String for UUID support
  type: scheduleTypeSchema,
  frequencyDays: z.coerce
    .number()
    .min(1, "Frequency must be at least 1 day")
    .max(365 * 5, "Frequency cannot exceed 5 years"),
  isActive: z.boolean().default(true),
  checklists: z.array(checklistItemSchema).optional(),
});

export const updateMaintenanceScheduleSchema = insertMaintenanceScheduleSchema
  .partial()
  .extend({
    checklists: z.array(checklistItemSchema).optional(),
  });

export type InsertMaintenanceSchedule = z.infer<
  typeof insertMaintenanceScheduleSchema
>;
export type UpdateMaintenanceSchedule = z.infer<
  typeof updateMaintenanceScheduleSchema
>;
