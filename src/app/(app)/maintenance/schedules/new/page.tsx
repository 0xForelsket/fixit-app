import { db } from "@/db";
import { ScheduleForm } from "../schedule-form";

async function getEquipment() {
  return db.query.equipment.findMany({
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
  });
}

export default async function NewSchedulePage() {
  const equipment = await getEquipment();

  return <ScheduleForm equipment={equipment} isNew />;
}
