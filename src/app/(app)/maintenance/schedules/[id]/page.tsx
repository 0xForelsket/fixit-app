import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { db } from "@/db";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteScheduleButton } from "../delete-schedule-button";
import { ScheduleForm } from "../schedule-form";

async function getSchedule(id: number) {
  return db.query.maintenanceSchedules.findFirst({
    where: eq(maintenanceSchedules.id, id),
    with: {
      equipment: true,
    },
  });
}

async function getChecklists(scheduleId: number) {
  return db.query.maintenanceChecklists.findMany({
    where: eq(maintenanceChecklists.scheduleId, scheduleId),
    orderBy: (checklists, { asc }) => [asc(checklists.stepNumber)],
  });
}

async function getEquipment() {
  return db.query.equipment.findMany({
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
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

  const [schedule, checklists, equipment] = await Promise.all([
    getSchedule(scheduleId),
    getChecklists(scheduleId),
    getEquipment(),
  ]);

  if (!schedule) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Schedules", href: "/maintenance/schedules" },
            { label: schedule.title },
          ]}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/maintenance/schedules"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Edit Schedule
              </h1>
              <p className="text-muted-foreground">{schedule.title}</p>
            </div>
          </div>
          <DeleteScheduleButton
            scheduleId={schedule.id}
            scheduleTitle={schedule.title}
          />
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <ScheduleForm
          schedule={schedule}
          checklists={checklists}
          equipment={equipment}
        />
      </div>
    </div>
  );
}
