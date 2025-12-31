import { db } from "@/db";
import {
  equipment,
  equipmentModels,
  equipmentTypes,
  locations,
  users,
} from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { requirePermission } from "@/lib/auth";
import { mapCSVToObjects, parseCSV } from "@/lib/csv";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireCsrf } from "@/lib/session";
import {
  type EquipmentImportRow,
  type ImportResult,
  equipmentImportFieldDefinitions,
  equipmentImportRowSchema,
  importOptionsSchema,
} from "@/lib/validations/import";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // CSRF protection
    await requireCsrf(request);

    // Rate limiting - imports are heavy operations
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `import:${clientIp}`,
      10, // 10 imports per minute
      60 * 1000
    );
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

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

    const mapping = equipmentImportFieldDefinitions.map((def) => {
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

    const parseResult = mapCSVToObjects<EquipmentImportRow>(
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

    const [allLocations, allModels, allTypes, allUsers, existingEquipment] =
      await Promise.all([
        db.select({ id: locations.id, code: locations.code }).from(locations),
        db
          .select({ id: equipmentModels.id, name: equipmentModels.name })
          .from(equipmentModels),
        db
          .select({ id: equipmentTypes.id, code: equipmentTypes.code })
          .from(equipmentTypes),
        db.select({ id: users.id, employeeId: users.employeeId }).from(users),
        db.select({ id: equipment.id, code: equipment.code }).from(equipment),
      ]);

    const locationMap = new Map(
      allLocations.map((l) => [l.code.toLowerCase(), l.id])
    );
    const modelMap = new Map(
      allModels.map((m) => [m.name.toLowerCase(), m.id])
    );
    const typeMap = new Map(allTypes.map((t) => [t.code.toLowerCase(), t.id]));
    const userMap = new Map(
      allUsers.map((u) => [u.employeeId.toLowerCase(), u.id])
    );
    const existingCodes = new Map(
      existingEquipment.map((e) => [e.code.toLowerCase(), e.id])
    );

    const toInsert: Array<{
      name: string;
      code: string;
      locationId: number;
      modelId?: number;
      typeId?: number;
      ownerId?: number;
      status: "operational" | "down" | "maintenance";
    }> = [];

    const toUpdate: Array<{
      id: number;
      name: string;
      code: string;
      locationId: number;
      modelId?: number;
      typeId?: number;
      ownerId?: number;
      status: "operational" | "down" | "maintenance";
    }> = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 2;

      const validated = equipmentImportRowSchema.safeParse(row);
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
      const locationId = locationMap.get(data.location_code.toLowerCase());
      if (!locationId) {
        result.errors.push({
          row: rowNum,
          field: "location_code",
          message: `Location "${data.location_code}" not found`,
          value: data.location_code,
        });
        continue;
      }

      let modelId: number | undefined;
      if (data.model_name) {
        modelId = modelMap.get(data.model_name.toLowerCase());
        if (!modelId) {
          result.warnings.push({
            row: rowNum,
            field: "model_name",
            message: `Model "${data.model_name}" not found, will be left empty`,
          });
        }
      }

      let typeId: number | undefined;
      if (data.type_code) {
        typeId = typeMap.get(data.type_code.toLowerCase());
        if (!typeId) {
          result.warnings.push({
            row: rowNum,
            field: "type_code",
            message: `Type "${data.type_code}" not found, will be left empty`,
          });
        }
      }

      let ownerId: number | undefined;
      if (data.owner_employee_id) {
        ownerId = userMap.get(data.owner_employee_id.toLowerCase());
        if (!ownerId) {
          result.warnings.push({
            row: rowNum,
            field: "owner_employee_id",
            message: `User "${data.owner_employee_id}" not found, will be left empty`,
          });
        }
      }

      const existingId = existingCodes.get(data.code.toLowerCase());
      if (existingId) {
        if (options.duplicateStrategy === "error") {
          result.errors.push({
            row: rowNum,
            field: "code",
            message: `Equipment with code "${data.code}" already exists`,
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
            name: data.name,
            code: data.code,
            locationId,
            modelId,
            typeId,
            ownerId,
            status: data.status,
          });
        }
      } else {
        toInsert.push({
          name: data.name,
          code: data.code,
          locationId,
          modelId,
          typeId,
          ownerId,
          status: data.status,
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
      await db.insert(equipment).values(toInsert);
      result.inserted = toInsert.length;
    }

    for (const item of toUpdate) {
      await db
        .update(equipment)
        .set({
          name: item.name,
          locationId: item.locationId,
          modelId: item.modelId,
          typeId: item.typeId,
          ownerId: item.ownerId,
          status: item.status,
        })
        .where(eq(equipment.id, item.id));
    }
    result.updated = toUpdate.length;

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return ApiErrors.forbidden(requestId);
    }
    apiLogger.error({ requestId, error }, "Equipment import error");
    return ApiErrors.internal(error, requestId);
  }
}
