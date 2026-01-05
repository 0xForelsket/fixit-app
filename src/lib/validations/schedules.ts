import { z } from "zod";

export const scheduleTypeSchema = z.enum(["maintenance", "calibration"]);

export const checklistItemSchema = z.object({
  id: z.string().optional(),
  stepNumber: z.number(),
  description: z.string(),
  isRequired: z.boolean(),
  estimatedMinutes: z.coerce.number().nullable(),
});

const baseScheduleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  equipmentId: z.string().min(1, "Equipment is required"),
  type: scheduleTypeSchema,
  frequencyDays: z.coerce
    .number()
    .min(1, "Frequency must be at least 1 day")
    .optional()
    .nullable(),
  meterId: z.string().optional().nullable(),
  meterInterval: z.coerce.number().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
  checklists: z.array(checklistItemSchema).optional(),
});

export const insertMaintenanceScheduleSchema = baseScheduleSchema.refine(
  (data) => {
    const hasTime = !!data.frequencyDays;
    const hasUsage = !!data.meterId && !!data.meterInterval;
    return hasTime || hasUsage;
  },
  {
    message: "Must specify either time-based or usage-based interval",
    path: ["frequencyDays"],
  }
);

export const updateMaintenanceScheduleSchema = baseScheduleSchema
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
