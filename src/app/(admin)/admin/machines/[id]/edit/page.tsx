import { db } from "@/db";
import { locations, machines, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MachineForm } from "../../machine-form";

export default async function EditMachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const machineId = Number.parseInt(id);

  if (Number.isNaN(machineId)) {
    notFound();
  }

  const [machine, locationsList, usersList, modelsList] = await Promise.all([
    db.query.machines.findFirst({
      where: eq(machines.id, machineId),
    }),
    db.query.locations.findMany({
      where: eq(locations.isActive, true),
    }),
    db.query.users.findMany({
      where: eq(users.isActive, true),
    }),
    db.query.machineModels.findMany(),
  ]);

  if (!machine) {
    notFound();
  }

  return (
    <MachineForm
      machine={machine}
      locations={locationsList}
      users={usersList}
      models={modelsList}
    />
  );
}
