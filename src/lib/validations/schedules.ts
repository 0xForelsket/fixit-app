import { z } from "zod";

export const scheduleTypeSchema = z.enum(["maintenance", "calibration"]);

export const createScheduleSchema = z.object({
  machineId: z.number().int().positive("Machine is required"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  type: scheduleTypeSchema,
  frequencyDays: z
    .number()
    .int()
    .positive("Frequency must be at least 1 day")
    .max(365 * 5, "Frequency cannot exceed 5 years"),
  nextDue: z.coerce.date(),
  isActive: z.boolean().default(true),
});

export const updateScheduleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .optional(),
  type: scheduleTypeSchema.optional(),
  frequencyDays: z
    .number()
    .int()
    .positive("Frequency must be at least 1 day")
    .max(365 * 5, "Frequency cannot exceed 5 years")
    .optional(),
  nextDue: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
