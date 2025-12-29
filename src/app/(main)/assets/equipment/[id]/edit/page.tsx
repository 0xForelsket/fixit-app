import { db } from "@/db";
import { equipment, locations, users } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EquipmentForm } from "../../equipment-form";

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);

  const { id } = await params;
  const equipmentId = Number.parseInt(id);

  if (Number.isNaN(equipmentId)) {
    notFound();
  }

  const [
    equipmentItem,
    locationsList,
    usersList,
    modelsList,
    categoriesList,
    typesList,
    equipmentList,
  ] = await Promise.all([
    db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
      with: {
        type: true,
      },
    }),
    db.query.locations.findMany({
      where: eq(locations.isActive, true),
    }),
    db.query.users.findMany({
      where: eq(users.isActive, true),
    }),
    db.query.equipmentModels.findMany(),
    db.query.equipmentCategories.findMany(),
    db.query.equipmentTypes.findMany(),
    db.query.equipment.findMany({
      columns: { id: true, name: true, code: true },
    }),
  ]);

  if (!equipmentItem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-96 rounded-xl border border-zinc-200 bg-white animate-pulse" />}>
        <EquipmentForm
          equipment={equipmentItem}
          locations={locationsList}
          users={usersList}
          models={modelsList}
          categories={categoriesList}
          types={typesList}
          equipmentList={equipmentList}
        />
      </Suspense>
    </div>
  );
}
