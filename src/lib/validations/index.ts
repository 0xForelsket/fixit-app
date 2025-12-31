// Re-export all validation schemas

export * from "./users";
export * from "./locations";
export * from "./equipment";
export * from "./workOrders";
export * from "./attachments";
export * from "./schedules";
export * from "./workOrderTemplates";

// Common validation helpers
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid ID"),
});

export const codeParamSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type CodeParamInput = z.infer<typeof codeParamSchema>;
