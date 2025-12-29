"use server";

import { db } from "@/db";
import { vendors, type NewVendor } from "@/db/schema";
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

  // TODO: Add permission check for INVENTORY_CREATE

  await db.insert(vendors).values({
    ...data,
  });

  revalidatePath("/assets/vendors");
  redirect("/assets/vendors");
}

export async function updateVendor(id: number, data: z.infer<typeof vendorSchema>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // TODO: Add permission check for INVENTORY_UPDATE

  await db.update(vendors).set(data).where(eq(vendors.id, id));

  revalidatePath("/assets/vendors");
  revalidatePath(`/assets/vendors/${id}`);
  redirect("/assets/vendors");
}

export async function deleteVendor(id: number) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // TODO: Add permission check for INVENTORY_DELETE

  // Soft delete or hard delete? Schema has isActive, let's use that or hard delete.
  // For now, let's just toggle isActive to false (soft delete approach often prefered in industrial)
  // But wait, schema says isActive default true. Let's just update isActive.
  await db.update(vendors).set({ isActive: false }).where(eq(vendors.id, id));

  revalidatePath("/assets/vendors");
}
