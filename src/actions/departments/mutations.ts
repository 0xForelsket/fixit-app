"use server";

import { db } from "@/db";
import { departments, equipment, users, workOrders } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  managerId: z.string().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export async function createDepartment(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const rawData = {
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    managerId: formData.get("managerId") || undefined,
  };

  const parsed = createDepartmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Check for duplicate name
  const existingName = await db.query.departments.findFirst({
    where: eq(departments.name, parsed.data.name),
  });
  if (existingName) {
    return {
      success: false,
      error: "A department with this name already exists",
    };
  }

  // Check for duplicate code
  const existingCode = await db.query.departments.findFirst({
    where: eq(departments.code, parsed.data.code),
  });
  if (existingCode) {
    return {
      success: false,
      error: "A department with this code already exists",
    };
  }

  const [newDepartment] = await db
    .insert(departments)
    .values({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      managerId: parsed.data.managerId || null,
    })
    .returning({ id: departments.id });

  revalidatePath("/admin/system");

  return { success: true, data: { id: newDepartment.id } };
}

export async function updateDepartment(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return { success: false, error: "Department not found" };
  }

  const rawData = {
    name: formData.get("name") || undefined,
    code: formData.get("code") || undefined,
    description: formData.get("description") || undefined,
    managerId: formData.get("managerId") || undefined,
  };

  const parsed = updateDepartmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Check for duplicate name
  if (parsed.data.name && parsed.data.name !== department.name) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, parsed.data.name),
    });
    if (existing) {
      return {
        success: false,
        error: "A department with this name already exists",
      };
    }
  }

  // Check for duplicate code
  if (parsed.data.code && parsed.data.code !== department.code) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.code, parsed.data.code),
    });
    if (existing) {
      return {
        success: false,
        error: "A department with this code already exists",
      };
    }
  }

  await db
    .update(departments)
    .set({
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.code && { code: parsed.data.code }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description || null,
      }),
      ...(parsed.data.managerId !== undefined && {
        managerId: parsed.data.managerId || null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id));

  revalidatePath("/admin/system");

  return { success: true };
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return { success: false, error: "Department not found" };
  }

  // Check for assigned users
  const usersInDept = await db.query.users.findFirst({
    where: eq(users.departmentId, id),
  });
  if (usersInDept) {
    return {
      success: false,
      error: "Cannot delete department: users are still assigned to it",
    };
  }

  // Check for assigned equipment
  const equipmentInDept = await db.query.equipment.findFirst({
    where: eq(equipment.departmentId, id),
  });
  if (equipmentInDept) {
    return {
      success: false,
      error: "Cannot delete department: equipment is still assigned to it",
    };
  }

  // Check for work orders
  const workOrdersInDept = await db.query.workOrders.findFirst({
    where: eq(workOrders.departmentId, id),
  });
  if (workOrdersInDept) {
    return {
      success: false,
      error: "Cannot delete department: work orders are associated with it",
    };
  }

  await db.delete(departments).where(eq(departments.id, id));

  revalidatePath("/admin/system");

  return { success: true };
}
