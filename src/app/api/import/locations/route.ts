import { db } from "@/db";
import { locations } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { mapCSVToObjects, parseCSV } from "@/lib/csv";
import { PERMISSIONS } from "@/lib/permissions";
import {
  type ImportResult,
  type LocationImportRow,
  importOptionsSchema,
  locationImportFieldDefinitions,
  locationImportRowSchema,
} from "@/lib/validations/import";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.LOCATION_CREATE);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const optionsJson = formData.get("options") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const options = optionsJson
      ? importOptionsSchema.parse(JSON.parse(optionsJson))
      : { duplicateStrategy: "skip" as const, validateOnly: false };

    const content = await file.text();
    const { rows, headers } = parseCSV(content);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    const mapping = locationImportFieldDefinitions.map((def) => {
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

    const parseResult = mapCSVToObjects<LocationImportRow>(
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

    const existingLocations = await db
      .select({ id: locations.id, code: locations.code })
      .from(locations);

    const existingCodes = new Map(
      existingLocations.map((l) => [l.code.toLowerCase(), l.id])
    );

    const toInsert: Array<{
      code: string;
      name: string;
      description?: string;
      parentId?: number;
    }> = [];

    const toUpdate: Array<{
      id: number;
      code: string;
      name: string;
      description?: string;
      parentId?: number;
    }> = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 2;

      const validated = locationImportRowSchema.safeParse(row);
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

      let parentId: number | undefined;
      if (data.parent_code) {
        parentId = existingCodes.get(data.parent_code.toLowerCase());
        if (!parentId) {
          result.warnings.push({
            row: rowNum,
            field: "parent_code",
            message: `Parent "${data.parent_code}" not found, will be left empty`,
          });
        }
      }

      const existingId = existingCodes.get(data.code.toLowerCase());
      if (existingId) {
        if (options.duplicateStrategy === "error") {
          result.errors.push({
            row: rowNum,
            field: "code",
            message: `Location with code "${data.code}" already exists`,
            value: data.code,
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
            code: data.code,
            name: data.name,
            description: data.description,
            parentId,
          });
        }
      } else {
        toInsert.push({
          code: data.code,
          name: data.name,
          description: data.description,
          parentId,
        });
        existingCodes.set(data.code.toLowerCase(), -1);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    if (options.validateOnly) {
      result.inserted = toInsert.length;
      result.updated = toUpdate.length;
      return NextResponse.json(result);
    }

    if (toInsert.length > 0) {
      await db.insert(locations).values(toInsert);
      result.inserted = toInsert.length;
    }

    for (const item of toUpdate) {
      await db
        .update(locations)
        .set({
          name: item.name,
          description: item.description,
          parentId: item.parentId,
        })
        .where(eq(locations.id, item.id));
    }
    result.updated = toUpdate.length;

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Locations import error:", error);
    return NextResponse.json(
      {
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
