"use server";

import { db } from "@/db";
import { attachments, roles, users } from "@/db/schema";
import { hashPin, requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { deleteObject } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { createUserSchema, updateUserSchema } from "@/lib/validations/users";
import { and, eq, inArray, ne } from "drizzle-orm";
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
    // Note: The attachment record is already created by the API during upload.
    // We just need to clean up any old avatars.

    const oldAvatars = await db.query.attachments.findMany({
      where: and(
        eq(attachments.entityType, "user"),
        eq(attachments.entityId, user.id),
        eq(attachments.type, "avatar"),
        ne(attachments.s3Key, rawData.s3Key)
      ),
    });

    if (oldAvatars.length > 0) {
      // Batch delete from DB in a single query (N+1 fix)
      const oldAvatarIds = oldAvatars.map((a) => a.id);
      await db.delete(attachments).where(inArray(attachments.id, oldAvatarIds));

      // Parallel S3 deletes (fire-and-forget, errors are logged but not blocking)
      await Promise.allSettled(
        oldAvatars
          .filter((a) => a.s3Key)
          .map((a) =>
            deleteObject(a.s3Key).catch((err) =>
              console.warn(
                `Failed to delete old avatar S3 object: ${a.s3Key}`,
                err
              )
            )
          )
      );
    }

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

export async function getUserById(id: string) {
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
): Promise<ActionResult<{ id: string }>> {
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

  // Parallel validation queries (N+1 optimization)
  const [existingByEmployeeId, existingByEmail, role] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.employeeId, parsed.data.employeeId),
    }),
    parsed.data.email
      ? db.query.users.findFirst({ where: eq(users.email, parsed.data.email) })
      : Promise.resolve(null),
    parsed.data.roleId
      ? db.query.roles.findFirst({ where: eq(roles.id, parsed.data.roleId) })
      : Promise.resolve(null),
  ]);

  if (existingByEmployeeId) {
    return {
      success: false,
      error: "A user with this Employee ID already exists",
    };
  }

  if (parsed.data.email && existingByEmail) {
    return { success: false, error: "A user with this email already exists" };
  }

  if (parsed.data.roleId && !role) {
    return { success: false, error: "Selected role does not exist" };
  }

  // Hash the PIN before storing
  const hashedPin = await hashPin(parsed.data.pin);

  const [newUser] = await db
    .insert(users)
    .values({
      employeeId: parsed.data.employeeId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      pin: hashedPin,
      roleId: parsed.data.roleId ?? null,
      isActive: parsed.data.isActive,
      hourlyRate: parsed.data.hourlyRate ?? null,
    })
    .returning({ id: users.id });

  revalidatePath("/admin/users");

  return { success: true, data: { id: newUser.id } };
}

export async function updateUser(
  id: string,
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

  if (parsed.data.roleId) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, parsed.data.roleId),
    });
    if (!role) {
      return { success: false, error: "Selected role does not exist" };
    }
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.email !== undefined)
    updateData.email = parsed.data.email || null;
  if (parsed.data.pin !== undefined && parsed.data.pin !== "") {
    // Hash the PIN before storing
    updateData.pin = await hashPin(parsed.data.pin);
  }
  if (parsed.data.roleId !== undefined) {
    updateData.roleId = parsed.data.roleId;
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

export async function deleteUser(id: string): Promise<ActionResult> {
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
