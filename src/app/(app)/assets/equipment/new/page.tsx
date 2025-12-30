import { db } from "@/db";
import { locations, users } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { EquipmentForm } from "../equipment-form";

export default async function NewEquipmentPage() {
  await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

  const [
    locationsList,
    usersList,
    modelsList,
    categoriesList,
    typesList,
    equipmentList,
    departmentsList,
  ] = await Promise.all([
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
    db.query.departments.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="h-96 rounded-xl border border-zinc-200 bg-white animate-pulse" />
        }
      >
        <EquipmentForm
          locations={locationsList}
          departments={departmentsList}
          users={usersList}
          models={modelsList}
          categories={categoriesList}
          types={typesList}
          equipmentList={equipmentList}
          isNew
        />
      </Suspense>
    </div>
  );
}
