import { db } from "@/db";
import { locations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EquipmentForm } from "../equipment-form";

export default async function NewEquipmentPage() {
  const [locationsList, usersList, modelsList, categoriesList, typesList] =
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
    ]);

  return (
    <EquipmentForm
      locations={locationsList}
      users={usersList}
      models={modelsList}
      categories={categoriesList}
      types={typesList}
      isNew
    />
  );
}
