import { z } from "zod";

export const ticketTypeSchema = z.enum([
  "breakdown",
  "maintenance",
  "calibration",
  "safety",
  "upgrade",
]);

export const ticketPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const ticketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const createTicketSchema = z.object({
  equipmentId: z.number().int().positive("Equipment is required"),
  type: ticketTypeSchema,
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description is too long"),
  priority: ticketPrioritySchema.default("medium"),
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

export const updateTicketSchema = z.object({
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
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  assignedToId: z.number().int().positive().optional().nullable(),
  resolutionNotes: z
    .string()
    .max(5000, "Resolution notes are too long")
    .optional()
    .nullable(),
});

export const resolveTicketSchema = z.object({
  resolutionNotes: z
    .string()
    .min(1, "Resolution notes are required")
    .max(5000, "Resolution notes are too long"),
});

export const addCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(2000, "Comment is too long"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ResolveTicketInput = z.infer<typeof resolveTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
