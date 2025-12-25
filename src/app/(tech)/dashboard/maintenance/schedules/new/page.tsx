import { db } from "@/db";
import { ScheduleForm } from "../schedule-form";

async function getMachines() {
  return db.query.machines.findMany({
    orderBy: (machines, { asc }) => [asc(machines.name)],
  });
}

export default async function NewSchedulePage() {
  const machines = await getMachines();

  return <ScheduleForm machines={machines} isNew />;
}
