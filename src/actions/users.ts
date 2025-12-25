"use server";

import { db } from "@/db";
import { attachments, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
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
    // 1. Mark old avatars as deleted (or physically delete them if we implemented deletion)
    // For now, we'll just insert the new one. The UI will always fetch the latest one.
    // Ideally, we should delete the old S3 object to save space.

    // 2. Insert new attachment
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
