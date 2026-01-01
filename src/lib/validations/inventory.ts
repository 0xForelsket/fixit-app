import { z } from "zod";

export const transactionSchema = z.object({
  partId: z.string().min(1),
  locationId: z.string().min(1), // Source location (or location for in/adjustment)
  toLocationId: z.string().optional(), // For transfers
  type: z.enum(["in", "out", "transfer", "adjustment"]),
  quantity: z.coerce.number().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const consumePartSchema = z.object({
  workOrderId: z.string().min(1), // Work order to associate the part consumption with
  partId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.number().min(1),
});

export type ConsumePartInput = z.infer<typeof consumePartSchema>;
