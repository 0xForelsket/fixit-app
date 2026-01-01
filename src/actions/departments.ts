"use server";

import { db } from "@/db";
import { departments, equipment, users, workOrders } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { asc, desc, eq, sql } from "drizzle-orm";
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
  managerId: z.coerce.number().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export async function getDepartments(params?: {
  sort?: "name" | "code" | "memberCount";
  dir?: "asc" | "desc";
}) {
  const orderBy = [];
  if (params?.sort) {
    const direction = params.dir === "asc" ? asc : desc;
    switch (params.sort) {
      case "name":
        orderBy.push(direction(departments.name));
        break;
      case "code":
        orderBy.push(direction(departments.code));
        break;
      case "memberCount":
        orderBy.push(
          direction(
            sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)`
          )
        );
        break;
    }
  }

  if (orderBy.length === 0) {
    orderBy.push(asc(departments.name));
  }

  const departmentsList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerId: departments.managerId,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)`,
      equipmentCount: sql<number>`(SELECT COUNT(*) FROM equipment WHERE equipment.department_id = departments.id)`,
    })
    .from(departments)
    .orderBy(...orderBy);

  // Get manager names
  const managerIds = departmentsList
    .map((d) => d.managerId)
    .filter((id): id is number => id !== null);

  const managers =
    managerIds.length > 0
      ? await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, managerIds),
          columns: { id: true, name: true },
        })
      : [];

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));

  return departmentsList.map((dept) => ({
    ...dept,
    managerName: dept.managerId ? managerMap.get(dept.managerId) || null : null,
  }));
}

export async function getDepartment(id: number) {
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
    with: {
      manager: {
        columns: { id: true, name: true },
      },
    },
  });

  return department ?? null;
}

export async function createDepartment(
  formData: FormData
): Promise<ActionResult<{ id: number }>> {
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
      managerId: parsed.data.managerId ?? null,
    })
    .returning({ id: departments.id });

  revalidatePath("/admin/system");

  return { success: true, data: { id: newDepartment.id } };
}

export async function updateDepartment(
  id: number,
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

export async function deleteDepartment(id: number): Promise<ActionResult> {
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
