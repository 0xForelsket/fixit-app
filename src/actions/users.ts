"use server";

import { db } from "@/db";
import { attachments, roles, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { createUserSchema, updateUserSchema } from "@/lib/validations/users";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserAvatar(rawData: {
  s3Key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    await db.insert(attachments).values({
      entityType: "user",
      entityId: user.id,
      type: "avatar",
      filename: rawData.filename,
      s3Key: rawData.s3Key,
      mimeType: rawData.mimeType,
      sizeBytes: rawData.sizeBytes,
      uploadedById: user.id,
    });

    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to update avatar:", error);
    return { error: "Failed to update profile picture" };
  }
}

export async function getUsers() {
  await requirePermission(PERMISSIONS.USER_VIEW);

  const usersList = await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    with: {
      assignedRole: true,
    },
  });

  return usersList;
}

export async function getUserById(id: number) {
  await requirePermission(PERMISSIONS.USER_VIEW);

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      assignedRole: true,
    },
  });

  return user ?? null;
}

export async function getAllRoles() {
  await requirePermission(PERMISSIONS.USER_VIEW);

  const rolesList = await db.query.roles.findMany({
    orderBy: (roles, { asc }) => [asc(roles.name)],
  });

  return rolesList;
}

export async function createUser(
  formData: FormData
): Promise<ActionResult<{ id: number }>> {
  await requirePermission(PERMISSIONS.USER_CREATE);

  const rawData = {
    employeeId: formData.get("employeeId"),
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    pin: formData.get("pin"),
    role: formData.get("role") || "operator",
    roleId: formData.get("roleId"),
    isActive: formData.get("isActive") === "true",
    hourlyRate: formData.get("hourlyRate") || undefined,
  };

  const parsed = createUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const existingByEmployeeId = await db.query.users.findFirst({
    where: eq(users.employeeId, parsed.data.employeeId),
  });

  if (existingByEmployeeId) {
    return {
      success: false,
      error: "A user with this Employee ID already exists",
    };
  }

  if (parsed.data.email) {
    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });
    if (existingByEmail) {
      return { success: false, error: "A user with this email already exists" };
    }
  }

  let role = null;
  let legacyRole: "operator" | "tech" | "admin" = "operator";

  if (parsed.data.roleId) {
    role = await db.query.roles.findFirst({
      where: eq(roles.id, parsed.data.roleId),
    });

    if (!role) {
      return { success: false, error: "Selected role does not exist" };
    }

    if (role.name.toLowerCase().includes("admin")) {
      legacyRole = "admin";
    } else if (role.name.toLowerCase().includes("tech")) {
      legacyRole = "tech";
    }
  }

  const [newUser] = await db
    .insert(users)
    .values({
      employeeId: parsed.data.employeeId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      pin: parsed.data.pin,
      role: legacyRole,
      roleId: parsed.data.roleId ?? null,
      isActive: parsed.data.isActive,
      hourlyRate: parsed.data.hourlyRate ?? null,
    })
    .returning({ id: users.id });

  revalidatePath("/admin/users");

  return { success: true, data: { id: newUser.id } };
}

export async function updateUser(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_UPDATE);

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const rawData = {
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    pin: formData.get("pin") || undefined,
    roleId: formData.get("roleId") || undefined,
    isActive: formData.has("isActive")
      ? formData.get("isActive") === "true"
      : undefined,
    hourlyRate: formData.get("hourlyRate") || undefined,
  };

  if (rawData.email === "") rawData.email = undefined;
  if (rawData.pin === "") rawData.pin = undefined;
  if (rawData.hourlyRate === "") rawData.hourlyRate = undefined;

  const parsed = updateUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  if (parsed.data.email && parsed.data.email !== user.email) {
    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });
    if (existingByEmail) {
      return { success: false, error: "A user with this email already exists" };
    }
  }

  let legacyRole: "operator" | "tech" | "admin" | undefined;
  if (parsed.data.roleId) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, parsed.data.roleId),
    });
    if (!role) {
      return { success: false, error: "Selected role does not exist" };
    }
    if (role.name.toLowerCase().includes("admin")) {
      legacyRole = "admin";
    } else if (role.name.toLowerCase().includes("tech")) {
      legacyRole = "tech";
    } else {
      legacyRole = "operator";
    }
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.email !== undefined)
    updateData.email = parsed.data.email || null;
  if (parsed.data.pin !== undefined && parsed.data.pin !== "")
    updateData.pin = parsed.data.pin;
  if (parsed.data.roleId !== undefined) {
    updateData.roleId = parsed.data.roleId;
    if (legacyRole) updateData.role = legacyRole;
  }
  if (parsed.data.isActive !== undefined)
    updateData.isActive = parsed.data.isActive;
  if (parsed.data.hourlyRate !== undefined)
    updateData.hourlyRate = parsed.data.hourlyRate;

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);

  return { success: true };
}

export async function deleteUser(id: number): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_DELETE);

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const currentUser = await getCurrentUser();
  if (currentUser?.id === id) {
    return { success: false, error: "You cannot delete your own account" };
  }

  await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  revalidatePath("/admin/users");

  return { success: true };
}
