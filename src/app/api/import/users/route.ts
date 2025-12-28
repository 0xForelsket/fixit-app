import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { mapCSVToObjects, parseCSV } from "@/lib/csv";
import { PERMISSIONS } from "@/lib/permissions";
import {
  type ImportResult,
  type UserImportRow,
  importOptionsSchema,
  userImportFieldDefinitions,
  userImportRowSchema,
} from "@/lib/validations/import";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.USER_CREATE);

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

    const mapping = userImportFieldDefinitions.map((def) => {
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

    const parseResult = mapCSVToObjects<UserImportRow>(rows, headers, mapping);
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

    const [allRoles, existingUsers] = await Promise.all([
      db.select({ id: roles.id, name: roles.name }).from(roles),
      db.select({ id: users.id, employeeId: users.employeeId }).from(users),
    ]);

    const roleMap = new Map(allRoles.map((r) => [r.name.toLowerCase(), r.id]));
    const existingEmployeeIds = new Map(
      existingUsers.map((u) => [u.employeeId.toLowerCase(), u.id])
    );

    const toInsert: Array<{
      employeeId: string;
      name: string;
      email?: string;
      pin: string;
      roleId: number;
      hourlyRate?: number;
    }> = [];

    const toUpdate: Array<{
      id: number;
      employeeId: string;
      name: string;
      email?: string;
      pin: string;
      roleId: number;
      hourlyRate?: number;
    }> = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 2;

      const validated = userImportRowSchema.safeParse(row);
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

      const roleId = roleMap.get(data.role_name.toLowerCase());
      if (!roleId) {
        result.errors.push({
          row: rowNum,
          field: "role_name",
          message: `Role "${data.role_name}" not found`,
          value: data.role_name,
        });
        continue;
      }

      const existingId = existingEmployeeIds.get(
        data.employee_id.toLowerCase()
      );
      if (existingId) {
        if (options.duplicateStrategy === "error") {
          result.errors.push({
            row: rowNum,
            field: "employee_id",
            message: `User with employee ID "${data.employee_id}" already exists`,
            value: data.employee_id,
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
            employeeId: data.employee_id,
            name: data.name,
            email: data.email || undefined,
            pin: data.pin,
            roleId,
            hourlyRate: data.hourly_rate,
          });
        }
      } else {
        toInsert.push({
          employeeId: data.employee_id,
          name: data.name,
          email: data.email || undefined,
          pin: data.pin,
          roleId,
          hourlyRate: data.hourly_rate,
        });
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
      await db.insert(users).values(toInsert);
      result.inserted = toInsert.length;
    }

    for (const item of toUpdate) {
      await db
        .update(users)
        .set({
          name: item.name,
          email: item.email,
          pin: item.pin,
          roleId: item.roleId,
          hourlyRate: item.hourlyRate,
        })
        .where(eq(users.id, item.id));
    }
    result.updated = toUpdate.length;

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Users import error:", error);
    return NextResponse.json(
      {
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
