import { z } from "zod";

export const entityTypeSchema = z.enum([
  "user",
  "equipment",
  "work_order",
  "location",
]);

export const attachmentTypeSchema = z.enum([
  "avatar",
  "photo",
  "document",
  "before",
  "after",
]);

export const uploadAttachmentSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().min(1, "Entity ID is required"),
  type: attachmentTypeSchema,
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename is too long"),
  mimeType: z
    .string()
    .min(1, "MIME type is required")
    .max(100, "MIME type is too long"),
  sizeBytes: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

export const listAttachmentsSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
});

// Allowed MIME types for uploads
export const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export const validateMimeType = (mimeType: string): boolean => {
  return (allowedMimeTypes as readonly string[]).includes(mimeType);
};

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
export type ListAttachmentsInput = z.infer<typeof listAttachmentsSchema>;
