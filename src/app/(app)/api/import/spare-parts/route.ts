import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { requirePermission } from "@/lib/auth";
import { mapCSVToObjects, parseCSV } from "@/lib/csv";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import {
  type ImportResult,
  type SparePartImportRow,
  importOptionsSchema,
  sparePartImportFieldDefinitions,
  sparePartImportRowSchema,
} from "@/lib/validations/import";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    await requirePermission(PERMISSIONS.INVENTORY_CREATE);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const optionsJson = formData.get("options") as string | null;

    if (!file) {
      return ApiErrors.validationError("No file provided", requestId);
    }

    const options = optionsJson
      ? importOptionsSchema.parse(JSON.parse(optionsJson))
      : { duplicateStrategy: "skip" as const, validateOnly: false };

    const content = await file.text();
    const { rows, headers } = parseCSV(content);

    if (rows.length === 0) {
      return ApiErrors.validationError("CSV file is empty", requestId);
    }

    const mapping = sparePartImportFieldDefinitions.map((def) => {
      const matchedHeader = headers.find((h) =>
        [def.field, ...def.aliases].some(
          (alias) => alias.toLowerCase() === h.toLowerCase()
        )
      );
      return {
        csvHeader: matchedHeader || def.field,
        field: def.field,
        required: def.required,
      };
    });

    const parseResult = mapCSVToObjects<SparePartImportRow>(
      rows,
      headers,
      mapping
    );
    const result: ImportResult = {
      success: true,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: parseResult.errors.map((e) => ({
        row: e.row,
        field: e.column,
        message: e.message,
        value: e.value,
      })),
      warnings: [],
    };

    if (parseResult.data.length === 0 && result.errors.length > 0) {
      result.success = false;
      return NextResponse.json(result);
    }

    const existingParts = await db
      .select({ id: spareParts.id, sku: spareParts.sku })
      .from(spareParts);

    const existingSkus = new Map(
      existingParts.map((p) => [p.sku.toLowerCase(), p.id])
    );

    const toInsert: Array<{
      name: string;
      sku: string;
      category:
        | "electrical"
        | "mechanical"
        | "hydraulic"
        | "pneumatic"
        | "consumable"
        | "safety"
        | "tooling"
        | "other";
      description?: string;
      barcode?: string;
      unitCost?: number;
      reorderPoint: number;
      leadTimeDays?: number;
    }> = [];

    const toUpdate: Array<{
      id: number;
      name: string;
      sku: string;
      category:
        | "electrical"
        | "mechanical"
        | "hydraulic"
        | "pneumatic"
        | "consumable"
        | "safety"
        | "tooling"
        | "other";
      description?: string;
      barcode?: string;
      unitCost?: number;
      reorderPoint: number;
      leadTimeDays?: number;
    }> = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 2;

      const validated = sparePartImportRowSchema.safeParse(row);
      if (!validated.success) {
        for (const issue of validated.error.issues) {
          result.errors.push({
            row: rowNum,
            field: issue.path.join("."),
            message: issue.message,
          });
        }
        continue;
      }

      const data = validated.data;

      const existingId = existingSkus.get(data.sku.toLowerCase());
      if (existingId) {
        if (options.duplicateStrategy === "error") {
          result.errors.push({
            row: rowNum,
            field: "sku",
            message: `Part with SKU "${data.sku}" already exists`,
            value: data.sku,
          });
          continue;
        }
        if (options.duplicateStrategy === "skip") {
          result.skipped++;
          continue;
        }
        if (options.duplicateStrategy === "update") {
          toUpdate.push({
            id: existingId,
            name: data.name,
            sku: data.sku,
            category: data.category,
            description: data.description,
            barcode: data.barcode,
            unitCost: data.unit_cost,
            reorderPoint: data.reorder_point,
            leadTimeDays: data.lead_time_days,
          });
        }
      } else {
        toInsert.push({
          name: data.name,
          sku: data.sku,
          category: data.category,
          description: data.description,
          barcode: data.barcode,
          unitCost: data.unit_cost,
          reorderPoint: data.reorder_point,
          leadTimeDays: data.lead_time_days,
        });
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    if (options.validateOnly) {
      result.inserted = toInsert.length;
      result.updated = toUpdate.length;
      return apiSuccess(result);
    }

    if (toInsert.length > 0) {
      await db.insert(spareParts).values(toInsert);
      result.inserted = toInsert.length;
    }

    for (const item of toUpdate) {
      await db
        .update(spareParts)
        .set({
          name: item.name,
          category: item.category,
          description: item.description,
          barcode: item.barcode,
          unitCost: item.unitCost,
          reorderPoint: item.reorderPoint,
          leadTimeDays: item.leadTimeDays,
        })
        .where(eq(spareParts.id, item.id));
    }
    result.updated = toUpdate.length;

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return ApiErrors.forbidden(requestId);
    }
    apiLogger.error({ requestId, error }, "Spare parts import error");
    return ApiErrors.internal(error, requestId);
  }
}
