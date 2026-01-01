"use server";

import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { createRoleSchema, updateRoleSchema } from "@/lib/validations/roles";
import { asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRoles(params?: {
  sort?: "name" | "description" | "userCount";
  dir?: "asc" | "desc";
}) {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const orderBy = [];
  if (params?.sort) {
    const direction = params.dir === "asc" ? asc : desc;
    switch (params.sort) {
      case "name":
        orderBy.push(direction(roles.name));
        break;
      case "description":
        orderBy.push(direction(roles.description));
        break;
      case "userCount":
        // Sorting by calculated field requires repeating the scalar subquery in orderBy or using sql fragment if supported.
        // Drizzle 0.30+ supports ordering by aliased columns if selected.
        // Let's try ordering by the sql fragment for now if aliasing issues arise.
        orderBy.push(
          direction(
            sql<number>`(SELECT COUNT(*) FROM users WHERE users.role_id = roles.id)`
          )
        );
        break;
    }
  }

  // Default sort
  if (orderBy.length === 0) {
    orderBy.push(asc(roles.name));
  }

  const rolesList = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      permissions: roles.permissions,
      isSystemRole: roles.isSystemRole,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
      userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.role_id = roles.id)`,
    })
    .from(roles)
    .orderBy(...orderBy);

  return rolesList;
}

export async function getRole(id: string) {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, id),
  });

  return role ?? null;
}

export async function createRole(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    permissions: formData.getAll("permissions"),
  };

  const parsed = createRoleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const existing = await db.query.roles.findFirst({
    where: eq(roles.name, parsed.data.name),
  });

  if (existing) {
    return { success: false, error: "A role with this name already exists" };
  }

  const [newRole] = await db
    .insert(roles)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      permissions: parsed.data.permissions,
      isSystemRole: false,
    })
    .returning({ id: roles.id });

  revalidatePath("/admin/roles");

  return { success: true, data: { id: newRole.id } };
}

export async function updateRole(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, id),
  });

  if (!role) {
    return { success: false, error: "Role not found" };
  }

  if (role.isSystemRole) {
    return { success: false, error: "System roles cannot be modified" };
  }

  const rawData = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    permissions: formData.getAll("permissions"),
  };

  if (rawData.permissions.length === 0) {
    rawData.permissions = undefined as unknown as string[];
  }

  const parsed = updateRoleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  if (parsed.data.name && parsed.data.name !== role.name) {
    const existing = await db.query.roles.findFirst({
      where: eq(roles.name, parsed.data.name),
    });
    if (existing) {
      return { success: false, error: "A role with this name already exists" };
    }
  }

  await db
    .update(roles)
    .set({
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.permissions && { permissions: parsed.data.permissions }),
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id));

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${id}`);

  return { success: true };
}

export async function deleteRole(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SYSTEM_SETTINGS);

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, id),
  });

  if (!role) {
    return { success: false, error: "Role not found" };
  }

  if (role.isSystemRole) {
    return { success: false, error: "System roles cannot be deleted" };
  }

  const usersWithRole = await db.query.users.findFirst({
    where: eq(users.roleId, id),
  });

  if (usersWithRole) {
    return {
      success: false,
      error: "Cannot delete role: users are still assigned to it",
    };
  }

  await db.delete(roles).where(eq(roles.id, id));

  revalidatePath("/admin/roles");

  return { success: true };
}
