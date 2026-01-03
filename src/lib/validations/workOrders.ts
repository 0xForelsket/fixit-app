import { z } from "zod";

export const workOrderTypeSchema = z.enum([
  "breakdown",
  "maintenance",
  "calibration",
  "safety",
  "upgrade",
]);

export const workOrderPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const workOrderStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const createWorkOrderSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required"),
  type: workOrderTypeSchema,
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description is too long"),
  priority: workOrderPrioritySchema.default("medium"),
  attachments: z
    .array(
      z.object({
        s3Key: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
      })
    )
    .optional(),
});

export const updateWorkOrderSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description is too long")
    .optional(),
  priority: workOrderPrioritySchema.optional(),
  status: workOrderStatusSchema.optional(),
  assignedToId: z.string().min(1).optional().nullable(),
  resolutionNotes: z
    .string()
    .max(5000, "Resolution notes are too long")
    .optional()
    .nullable(),
});

export const resolveWorkOrderSchema = z.object({
  resolutionNotes: z
    .string()
    .min(1, "Resolution notes are required")
    .max(5000, "Resolution notes are too long"),
  signature: z.string().optional(), // Base64 encoded PNG data URL
});

export const addCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(2000, "Comment is too long"),
});

export const updateChecklistItemSchema = z.object({
  status: z.enum(["pending", "completed", "skipped", "na"]),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type ResolveWorkOrderInput = z.infer<typeof resolveWorkOrderSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type UpdateChecklistItemInput = z.infer<
  typeof updateChecklistItemSchema
>;
