"use server";

import { db } from "@/db";
import {
  inventoryLevels,
  inventoryTransactions,
  workOrderParts,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
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
  if (!user || !userHasPermission(user, PERMISSIONS.INVENTORY_RECEIVE_STOCK)) {
    throw new Error("Unauthorized");
  }

  const validated = transactionSchema.parse(input);

  /**
   * Inventory transaction with stock level updates.
   *
   * Transaction Requirements:
   * - CRITICAL: Uses read-then-write pattern for stock levels
   * - Must prevent race conditions (two concurrent deductions)
   * - SQLite SERIALIZABLE isolation handles this automatically
   * - PostgreSQL migration: MUST use SERIALIZABLE isolation level
   *
   * @see docs/transactions.md for isolation level documentation
   */
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

    revalidatePath("/assets/inventory");
    revalidatePath("/assets/inventory/transactions");
    return { success: true };
  } catch (error) {
    inventoryLogger.error({ error, input: validated }, "Transaction error");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    };
  }
}

export async function consumeWorkOrderPartAction(input: ConsumePartInput) {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.INVENTORY_USE_PARTS)) {
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

      // 3. Record Work Order Part
      await tx.insert(workOrderParts).values({
        workOrderId: validated.workOrderId,
        partId: validated.partId,
        quantity: validated.quantity,
        unitCost: stock.part.unitCost, // Capture cost at time of use
        addedById: user.id,
      });

      // 4. Create Transaction Log
      await tx.insert(inventoryTransactions).values({
        partId: validated.partId,
        locationId: validated.locationId,
        workOrderId: validated.workOrderId,
        type: "out", // Consumed
        quantity: validated.quantity,
        reference: `WO #${validated.workOrderId}`,
        createdById: user.id,
      });
    });

    revalidatePath(`/maintenance/work-orders/${validated.workOrderId}`);
    revalidatePath(`/admin/work-orders/${validated.workOrderId}`);
    revalidatePath("/assets/inventory");

    return { success: true };
  } catch (error) {
    inventoryLogger.error({ error, input: validated }, "Consume part error");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    };
  }
}
