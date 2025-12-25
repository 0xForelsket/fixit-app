"use server";

import { db } from "@/db";
import {
  inventoryLevels,
  inventoryTransactions,
  ticketParts,
} from "@/db/schema";
import { inventoryLogger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import {
  type ConsumePartInput,
  type TransactionInput,
  consumePartSchema,
  transactionSchema,
} from "@/lib/validations/inventory";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTransactionAction(input: TransactionInput) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const validated = transactionSchema.parse(input);

  try {
    await db.transaction(async (tx) => {
      // 1. Handle Source Location Level
      const sourceLevel = await tx.query.inventoryLevels.findFirst({
        where: and(
          eq(inventoryLevels.partId, validated.partId),
          eq(inventoryLevels.locationId, validated.locationId)
        ),
      });

      const currentQty = sourceLevel?.quantity || 0;
      let newQty = currentQty;

      if (validated.type === "in") {
        newQty += validated.quantity;
      } else if (validated.type === "out") {
        newQty -= validated.quantity;
      } else if (validated.type === "adjustment") {
        newQty += validated.quantity;
      } else if (validated.type === "transfer") {
        if (!validated.toLocationId)
          throw new Error("Target location required for transfer");
        newQty -= validated.quantity;

        // Handle Target Location Level
        const targetLevel = await tx.query.inventoryLevels.findFirst({
          where: and(
            eq(inventoryLevels.partId, validated.partId),
            eq(inventoryLevels.locationId, validated.toLocationId)
          ),
        });

        const targetQty = (targetLevel?.quantity || 0) + validated.quantity;

        if (targetLevel) {
          await tx
            .update(inventoryLevels)
            .set({ quantity: targetQty, updatedAt: new Date() })
            .where(eq(inventoryLevels.id, targetLevel.id));
        } else {
          await tx.insert(inventoryLevels).values({
            partId: validated.partId,
            locationId: validated.toLocationId,
            quantity: targetQty,
          });
        }
      }

      if (newQty < 0) {
        throw new Error("Insufficient stock for this operation");
      }

      // Update Source Level
      if (sourceLevel) {
        await tx
          .update(inventoryLevels)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(inventoryLevels.id, sourceLevel.id));
      } else {
        // Create if 'in' or positive adjustment
        if (newQty > 0) {
          await tx.insert(inventoryLevels).values({
            partId: validated.partId,
            locationId: validated.locationId,
            quantity: newQty,
          });
        } else if (newQty < 0) {
          throw new Error("Cannot have negative stock");
        }
      }

      // 2. Create Transaction Log
      await tx.insert(inventoryTransactions).values({
        partId: validated.partId,
        locationId: validated.locationId,
        toLocationId: validated.toLocationId,
        type: validated.type,
        quantity: validated.quantity,
        reference: validated.reference,
        notes: validated.notes,
        createdById: user.id,
      });
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/inventory/transactions");
    return { success: true };
  } catch (error) {
    inventoryLogger.error({ error, input: validated }, "Transaction error");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    };
  }
}

export async function consumeTicketPartAction(input: ConsumePartInput) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "tech")) {
    throw new Error("Unauthorized");
  }

  const validated = consumePartSchema.parse(input);

  try {
    await db.transaction(async (tx) => {
      // 1. Check Stock
      const stock = await tx.query.inventoryLevels.findFirst({
        where: and(
          eq(inventoryLevels.partId, validated.partId),
          eq(inventoryLevels.locationId, validated.locationId)
        ),
        with: {
          part: true,
        },
      });

      if (!stock || stock.quantity < validated.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${stock?.quantity || 0}`
        );
      }

      // 2. Consume Stock
      const newQty = stock.quantity - validated.quantity;
      await tx
        .update(inventoryLevels)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(inventoryLevels.id, stock.id));

      // 3. Record Ticket Part
      await tx.insert(ticketParts).values({
        ticketId: validated.ticketId,
        partId: validated.partId,
        quantity: validated.quantity,
        unitCost: stock.part.unitCost, // Capture cost at time of use
        addedById: user.id,
      });

      // 4. Create Transaction Log
      await tx.insert(inventoryTransactions).values({
        partId: validated.partId,
        locationId: validated.locationId,
        ticketId: validated.ticketId,
        type: "out", // Consumed
        quantity: validated.quantity,
        reference: `Ticket #${validated.ticketId}`,
        createdById: user.id,
      });
    });

    revalidatePath(`/dashboard/tickets/${validated.ticketId}`);
    revalidatePath(`/admin/tickets/${validated.ticketId}`);
    revalidatePath("/admin/inventory");

    return { success: true };
  } catch (error) {
    inventoryLogger.error({ error, input: validated }, "Consume part error");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    };
  }
}
