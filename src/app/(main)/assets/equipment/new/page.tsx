import { db } from "@/db";
import { locations, users } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";
import { EquipmentForm } from "../equipment-form";

export default async function NewEquipmentPage() {
  await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

    const [locationsList, usersList, modelsList, categoriesList, typesList, equipmentList] =
      await Promise.all([
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
  
    return (
      <EquipmentForm
        locations={locationsList}
        users={usersList}
        models={modelsList}
        categories={categoriesList}
        types={typesList}
        equipmentList={equipmentList}
        isNew
      />
    );
}
