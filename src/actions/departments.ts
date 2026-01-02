"use server";

import { db } from "@/db";
import { attachments, departments, equipment, locations, roles, users, workOrders } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
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
    .filter((id): id is string => id !== null);

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

export async function getDepartment(id: string) {
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

// ============ PUBLIC DATA FETCHING FUNCTIONS ============
// These are accessible to all authenticated users (no permission check)

/**
 * Get all departments with stats for the public listing page
 */
export async function getDepartmentsWithStats() {
  const departmentsList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerId: departments.managerId,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)::int`,
      equipmentCount: sql<number>`(SELECT COUNT(*) FROM equipment WHERE equipment.department_id = departments.id)::int`,
      activeWorkOrderCount: sql<number>`(SELECT COUNT(*) FROM work_orders WHERE work_orders.department_id = departments.id AND work_orders.status IN ('open', 'in_progress'))::int`,
    })
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.name));

  // Get manager info with avatars
  const managerIds = departmentsList
    .map((d) => d.managerId)
    .filter((id): id is string => id !== null);

  if (managerIds.length === 0) {
    return departmentsList.map((dept) => ({
      ...dept,
      managerName: null,
      managerAvatarUrl: null,
    }));
  }

  const managers = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, managerIds));

  // Get avatar URLs for managers
  const managerAvatars = await db
    .select({
      entityId: attachments.entityId,
      s3Key: attachments.s3Key,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.entityType, "user"),
        eq(attachments.type, "avatar"),
        inArray(attachments.entityId, managerIds)
      )
    );

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));
  const avatarMap = new Map(
    managerAvatars.map((a) => [a.entityId, `/api/attachments/${a.s3Key}`])
  );

  return departmentsList.map((dept) => ({
    ...dept,
    managerName: dept.managerId ? managerMap.get(dept.managerId) || null : null,
    managerAvatarUrl: dept.managerId ? avatarMap.get(dept.managerId) || null : null,
  }));
}

/**
 * Get full department details with members, equipment, and work orders
 */
export async function getDepartmentWithDetails(id: string) {
  // Get department base info
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return null;
  }

  // Get manager with role and avatar
  let manager = null;
  if (department.managerId) {
    const managerData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, department.managerId))
      .limit(1);

    if (managerData.length > 0) {
      const avatar = await db
        .select({ s3Key: attachments.s3Key })
        .from(attachments)
        .where(
          and(
            eq(attachments.entityType, "user"),
            eq(attachments.type, "avatar"),
            eq(attachments.entityId, department.managerId)
          )
        )
        .limit(1);

      manager = {
        ...managerData[0],
        avatarUrl: avatar.length > 0 ? `/api/attachments/${avatar[0].s3Key}` : null,
      };
    }
  }

  // Get department members with their work order counts
  const membersData = await db
    .select({
      id: users.id,
      name: users.name,
      employeeId: users.employeeId,
      email: users.email,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(
      and(eq(users.departmentId, id), eq(users.isActive, true))
    )
    .orderBy(asc(users.name));

  // Get avatars for all members
  const memberIds = membersData.map((m) => m.id);
  const memberAvatars =
    memberIds.length > 0
      ? await db
          .select({
            entityId: attachments.entityId,
            s3Key: attachments.s3Key,
          })
          .from(attachments)
          .where(
            and(
              eq(attachments.entityType, "user"),
              eq(attachments.type, "avatar"),
              inArray(attachments.entityId, memberIds)
            )
          )
      : [];

  // Get active work order counts per member
  const memberWorkOrderCounts =
    memberIds.length > 0
      ? await db
          .select({
            assignedToId: workOrders.assignedToId,
            count: sql<number>`count(*)::int`,
          })
          .from(workOrders)
          .where(
            and(
              inArray(workOrders.assignedToId, memberIds),
              or(
                eq(workOrders.status, "open"),
                eq(workOrders.status, "in_progress")
              )
            )
          )
          .groupBy(workOrders.assignedToId)
      : [];

  const avatarMap = new Map(
    memberAvatars.map((a) => [a.entityId, `/api/attachments/${a.s3Key}`])
  );
  const woCountMap = new Map(
    memberWorkOrderCounts.map((c) => [c.assignedToId, c.count])
  );

  const members = membersData.map((m) => ({
    ...m,
    avatarUrl: avatarMap.get(m.id) || null,
    activeWorkOrderCount: woCountMap.get(m.id) || 0,
  }));

  // Get equipment assigned to department
  const equipmentData = await db
    .select({
      id: equipment.id,
      name: equipment.name,
      code: equipment.code,
      status: equipment.status,
      locationName: locations.name,
    })
    .from(equipment)
    .leftJoin(locations, eq(equipment.locationId, locations.id))
    .where(eq(equipment.departmentId, id))
    .orderBy(asc(equipment.name))
    .limit(50);

  // Get recent work orders for this department
  const workOrdersData = await db
    .select({
      id: workOrders.id,
      title: workOrders.title,
      status: workOrders.status,
      priority: workOrders.priority,
      createdAt: workOrders.createdAt,
      assignedToId: workOrders.assignedToId,
    })
    .from(workOrders)
    .where(eq(workOrders.departmentId, id))
    .orderBy(desc(workOrders.createdAt))
    .limit(20);

  // Get assignee names for work orders
  const assigneeIds = workOrdersData
    .map((wo) => wo.assignedToId)
    .filter((id): id is string => id !== null);
  
  const assignees =
    assigneeIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, assigneeIds))
      : [];
  
  const assigneeMap = new Map(assignees.map((a) => [a.id, a.name]));

  const workOrdersList = workOrdersData.map((wo) => ({
    id: wo.id,
    title: wo.title,
    status: wo.status,
    priority: wo.priority,
    createdAt: wo.createdAt,
    assigneeName: wo.assignedToId ? assigneeMap.get(wo.assignedToId) || null : null,
  }));

  // Get counts
  const memberCount = members.length;
  const equipmentCount = equipmentData.length;
  const workOrderCount = workOrdersData.length;

  return {
    ...department,
    manager,
    members,
    equipment: equipmentData,
    workOrders: workOrdersList,
    memberCount,
    equipmentCount,
    workOrderCount,
  };
}
