import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { and, eq } from "drizzle-orm";

/**
 * Fetches the latest avatar URL for a given user.
 * Returns null if the user has no avatar.
 */
export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const avatar = await db.query.attachments.findFirst({
    where: and(
      eq(attachments.entityType, "user"),
      eq(attachments.entityId, userId),
      eq(attachments.type, "avatar")
    ),
    orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
  });

  if (!avatar) return null;

  try {
    return await getPresignedDownloadUrl(avatar.s3Key);
  } catch (error) {
    console.error(`Failed to generate avatar URL for user ${userId}:`, error);
    return null;
  }
}
