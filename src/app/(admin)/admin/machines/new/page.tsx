import { db } from "@/db";
import { locations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MachineForm } from "../machine-form";

export default async function NewMachinePage() {
  const [locationsList, usersList, modelsList] = await Promise.all([
    db.query.locations.findMany({
      where: eq(locations.isActive, true),
    }),
    db.query.users.findMany({
      where: eq(users.isActive, true),
    }),
    db.query.machineModels.findMany(),
  ]);

  return (
    <MachineForm
      locations={locationsList}
      users={usersList}
      models={modelsList}
      isNew
    />
  );
}
