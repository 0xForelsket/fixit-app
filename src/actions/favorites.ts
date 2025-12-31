"use server";

import { db } from "@/db";
import {
  equipment,
  userFavorites,
  type FavoriteEntityType,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface FavoriteWithEquipment {
  id: number;
  entityType: FavoriteEntityType;
  entityId: number;
  createdAt: Date;
  equipment: {
    id: number;
    name: string;
    code: string;
    status: string;
  } | null;
}

/**
 * Get all favorites for the current user with equipment details
 */
export async function getUserFavorites(): Promise<
  ActionResult<FavoriteWithEquipment[]>
> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const favorites = await db.query.userFavorites.findMany({
    where: eq(userFavorites.userId, user.id),
    orderBy: (userFavorites, { desc }) => [desc(userFavorites.createdAt)],
  });

  // Fetch equipment details for equipment favorites
  const equipmentIds = favorites
    .filter((f) => f.entityType === "equipment")
    .map((f) => f.entityId);

  // Fetch all equipment if we have any favorites, then filter
  const allEquipmentItems =
    equipmentIds.length > 0
      ? await db.query.equipment.findMany({
          columns: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        })
      : [];

  // Filter to only the favorited equipment
  const filteredEquipment = allEquipmentItems.filter((e) =>
    equipmentIds.includes(e.id)
  );

  const equipmentMap = new Map(filteredEquipment.map((e) => [e.id, e]));

  const favoritesWithDetails: FavoriteWithEquipment[] = favorites.map((f) => ({
    id: f.id,
    entityType: f.entityType as FavoriteEntityType,
    entityId: f.entityId,
    createdAt: f.createdAt,
    equipment:
      f.entityType === "equipment" ? equipmentMap.get(f.entityId) ?? null : null,
  }));

  return { success: true, data: favoritesWithDetails };
}

/**
 * Toggle favorite status for an entity
 * Adds if not favorited, removes if already favorited
 */
export async function toggleFavorite(
  entityType: FavoriteEntityType,
  entityId: number
): Promise<ActionResult<{ isFavorited: boolean }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if already favorited
  const existing = await db.query.userFavorites.findFirst({
    where: and(
      eq(userFavorites.userId, user.id),
      eq(userFavorites.entityType, entityType),
      eq(userFavorites.entityId, entityId)
    ),
  });

  if (existing) {
    // Remove favorite
    await db.delete(userFavorites).where(eq(userFavorites.id, existing.id));
    revalidatePath("/assets/equipment");
    if (entityType === "equipment") {
      revalidatePath(`/assets/equipment/${entityId}`);
    }
    return { success: true, data: { isFavorited: false } };
  }

  // Add favorite
  await db.insert(userFavorites).values({
    userId: user.id,
    entityType,
    entityId,
  });

  revalidatePath("/assets/equipment");
  if (entityType === "equipment") {
    revalidatePath(`/assets/equipment/${entityId}`);
  }

  return { success: true, data: { isFavorited: true } };
}

/**
 * Check if an entity is favorited by the current user
 */
export async function isFavorite(
  entityType: FavoriteEntityType,
  entityId: number
): Promise<ActionResult<boolean>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await db.query.userFavorites.findFirst({
    where: and(
      eq(userFavorites.userId, user.id),
      eq(userFavorites.entityType, entityType),
      eq(userFavorites.entityId, entityId)
    ),
  });

  return { success: true, data: !!existing };
}

/**
 * Get favorite IDs for an entity type (useful for bulk checking)
 */
export async function getFavoriteIds(
  entityType: FavoriteEntityType
): Promise<ActionResult<number[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const favorites = await db.query.userFavorites.findMany({
    where: and(
      eq(userFavorites.userId, user.id),
      eq(userFavorites.entityType, entityType)
    ),
    columns: {
      entityId: true,
    },
  });

  return { success: true, data: favorites.map((f) => f.entityId) };
}
