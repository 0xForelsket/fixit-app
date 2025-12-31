"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function createVendor(data: z.infer<typeof vendorSchema>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!userHasPermission(user, PERMISSIONS.INVENTORY_CREATE)) {
    throw new Error("Forbidden: You don't have permission to create vendors");
  }

  const [vendor] = await db
    .insert(vendors)
    .values({
      ...data,
    })
    .returning();

  await logAudit({
    entityType: "vendor",
    entityId: vendor.id,
    action: "CREATE",
    details: data,
  });

  revalidatePath("/assets/vendors");
  redirect("/assets/vendors");
}

export async function updateVendor(
  id: number,
  data: z.infer<typeof vendorSchema>
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!userHasPermission(user, PERMISSIONS.INVENTORY_UPDATE)) {
    throw new Error("Forbidden: You don't have permission to update vendors");
  }

  await db.update(vendors).set(data).where(eq(vendors.id, id));

  await logAudit({
    entityType: "vendor",
    entityId: id,
    action: "UPDATE",
    details: data,
  });

  revalidatePath("/assets/vendors");
  revalidatePath(`/assets/vendors/${id}`);
  redirect("/assets/vendors");
}

export async function deleteVendor(id: number) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!userHasPermission(user, PERMISSIONS.INVENTORY_DELETE)) {
    throw new Error("Forbidden: You don't have permission to delete vendors");
  }

  await db.update(vendors).set({ isActive: false }).where(eq(vendors.id, id));

  await logAudit({
    entityType: "vendor",
    entityId: id,
    action: "DELETE",
    details: { reason: "Soft delete (isActive=false)" },
  });

  revalidatePath("/assets/vendors");
}
