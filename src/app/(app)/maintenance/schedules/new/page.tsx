import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { db } from "@/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ScheduleForm } from "../schedule-form";

async function getEquipment() {
  return db.query.equipment.findMany({
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
  });
}

export default async function NewSchedulePage() {
  const equipment = await getEquipment();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Schedules", href: "/maintenance/schedules" },
            { label: "New" },
          ]}
        />
        <div className="flex items-center gap-4">
          <Link
            href="/maintenance/schedules"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Schedule</h1>
            <p className="text-muted-foreground">
              Create a new maintenance schedule
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <ScheduleForm equipment={equipment} isNew />
      </div>
    </div>
  );
}
