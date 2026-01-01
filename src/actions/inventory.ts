"use server";

import { db } from "@/db";
import {
  inventoryLevels,
  inventoryTransactions,
  spareParts,
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

// ============ CSV Import Types ============

export interface PartImportRow {
  partNumber: string;
  name: string;
  description?: string;
  quantity?: number;
  minStock?: number;
  unitCost?: number;
  location?: string;
  manufacturer?: string;
}

export interface PartImportRowResult {
  row: number;
  success: boolean;
  partNumber: string;
  error?: string;
  partId?: string;
}

export interface PartImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: PartImportRowResult[];
  error?: string;
}

// ============ CSV Import Action ============

export async function importPartsFromCSV(
  rows: PartImportRow[]
): Promise<PartImportResult> {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.INVENTORY_CREATE)) {
    return {
      success: false,
      totalRows: rows.length,
      successCount: 0,
      failureCount: rows.length,
      results: [],
      error: "Unauthorized: You do not have permission to import parts",
    };
  }

  const results: PartImportRowResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Get all locations for lookup
  const allLocations = await db.query.locations.findMany();
  const locationMap = new Map<string, string>(
    allLocations.map((loc) => [loc.name.toLowerCase(), loc.id])
  );

  // Also map by code
  for (const loc of allLocations) {
    locationMap.set(loc.code.toLowerCase(), loc.id);
  }

  // Get existing SKUs to check for duplicates
  const existingParts = await db.query.spareParts.findMany({
    columns: { sku: true },
  });
  const existingSkus = new Set(existingParts.map((p) => p.sku.toLowerCase()));

  // Validate all rows first and prepare batch data
  type ValidatedRow = {
    rowNum: number;
    sku: string;
    name: string;
    description: string | null;
    minStock: number;
    unitCost: number | null;
    quantity?: number;
    locationId?: string;
    manufacturer?: string;
  };

  const validRows: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    try {
      // Validate required fields
      if (!row.partNumber || row.partNumber.trim() === "") {
        throw new Error("Part number is required");
      }

      if (!row.name || row.name.trim() === "") {
        throw new Error("Name is required");
      }

      const sku = row.partNumber.trim();

      // Check for duplicate SKU
      if (existingSkus.has(sku.toLowerCase())) {
        throw new Error(`Part with SKU "${sku}" already exists`);
      }

      // Validate numeric fields
      const quantity =
        row.quantity !== undefined ? Number(row.quantity) : undefined;
      const minStock =
        row.minStock !== undefined ? Number(row.minStock) : undefined;
      const unitCost =
        row.unitCost !== undefined ? Number(row.unitCost) : undefined;

      if (quantity !== undefined && (Number.isNaN(quantity) || quantity < 0)) {
        throw new Error("Quantity must be a non-negative number");
      }

      if (minStock !== undefined && (Number.isNaN(minStock) || minStock < 0)) {
        throw new Error("Min stock must be a non-negative number");
      }

      if (unitCost !== undefined && (Number.isNaN(unitCost) || unitCost < 0)) {
        throw new Error("Unit cost must be a non-negative number");
      }

      // Lookup location if provided
      let locationId: string | undefined;
      if (row.location && row.location.trim() !== "") {
        locationId = locationMap.get(row.location.trim().toLowerCase());
        if (!locationId) {
          throw new Error(`Location "${row.location}" not found`);
        }
      }

      // Add to existing SKUs set to prevent duplicates within same import
      existingSkus.add(sku.toLowerCase());

      validRows.push({
        rowNum,
        sku,
        name: row.name.trim(),
        description: row.description?.trim() || null,
        minStock: minStock ?? 0,
        unitCost: unitCost ?? null,
        quantity,
        locationId,
        manufacturer: row.manufacturer,
      });
    } catch (error) {
      results.push({
        row: rowNum,
        success: false,
        partNumber: row.partNumber || `(row ${rowNum})`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failureCount++;
    }
  }

  // Batch insert valid parts
  if (validRows.length > 0) {
    try {
      // Insert all parts in a single batch
      const insertedParts = await db
        .insert(spareParts)
        .values(
          validRows.map((row) => ({
            sku: row.sku,
            name: row.name,
            description: row.description,
            category: "other" as const,
            reorderPoint: row.minStock,
            unitCost: row.unitCost,
            isActive: true,
          }))
        )
        .returning({ id: spareParts.id });

      // Map inserted parts back to rows
      const inventoryLevelValues: Array<{
        partId: string;
        locationId: string;
        quantity: number;
      }> = [];

      const transactionValues: Array<{
        partId: string;
        locationId: string;
        type: "in";
        quantity: number;
        reference: string;
        notes: string;
        createdById: string;
      }> = [];

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const insertedPart = insertedParts[i];

        results.push({
          row: row.rowNum,
          success: true,
          partNumber: row.sku,
          partId: insertedPart.id,
        });
        successCount++;

        // Collect inventory levels and transactions for batch insert
        if (row.quantity !== undefined && row.quantity > 0 && row.locationId) {
          inventoryLevelValues.push({
            partId: insertedPart.id,
            locationId: row.locationId,
            quantity: row.quantity,
          });

          transactionValues.push({
            partId: insertedPart.id,
            locationId: row.locationId,
            type: "in",
            quantity: row.quantity,
            reference: "CSV Import",
            notes: `Initial stock from CSV import${row.manufacturer ? ` - Manufacturer: ${row.manufacturer}` : ""}`,
            createdById: user.id,
          });
        }
      }

      // Batch insert inventory levels
      if (inventoryLevelValues.length > 0) {
        await db.insert(inventoryLevels).values(inventoryLevelValues);
      }

      // Batch insert transactions
      if (transactionValues.length > 0) {
        await db.insert(inventoryTransactions).values(transactionValues);
      }
    } catch (error) {
      // If batch insert fails, mark all remaining rows as failed
      for (const row of validRows) {
        if (!results.find((r) => r.row === row.rowNum)) {
          results.push({
            row: row.rowNum,
            success: false,
            partNumber: row.sku,
            error: error instanceof Error ? error.message : "Database error",
          });
          failureCount++;
          successCount = Math.max(0, successCount - 1);
        }
      }
    }
  }

  revalidatePath("/assets/inventory");
  revalidatePath("/assets/inventory/parts");

  return {
    success: failureCount === 0,
    totalRows: rows.length,
    successCount,
    failureCount,
    results,
  };
}
