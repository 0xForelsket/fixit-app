import { db } from "@/db";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ScheduleForm } from "../schedule-form";

async function getSchedule(id: number) {
  return db.query.maintenanceSchedules.findFirst({
    where: eq(maintenanceSchedules.id, id),
    with: {
      machine: true,
    },
  });
}

async function getChecklists(scheduleId: number) {
  return db.query.maintenanceChecklists.findMany({
    where: eq(maintenanceChecklists.scheduleId, scheduleId),
    orderBy: (checklists, { asc }) => [asc(checklists.stepNumber)],
  });
}

async function getMachines() {
  return db.query.machines.findMany({
    orderBy: (machines, { asc }) => [asc(machines.name)],
  });
}

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scheduleId = Number.parseInt(id);

  if (Number.isNaN(scheduleId)) {
    notFound();
  }

  const [schedule, checklists, machines] = await Promise.all([
    getSchedule(scheduleId),
    getChecklists(scheduleId),
    getMachines(),
  ]);

  if (!schedule) {
    notFound();
  }

  return (
    <ScheduleForm
      schedule={schedule}
      checklists={checklists}
      machines={machines}
    />
  );
}
