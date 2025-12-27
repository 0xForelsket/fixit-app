import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface MaintenanceScheduleItem {
  id: number;
  name: string;
  type: string;
  nextDueDate: Date;
  frequencyDays: number;
  workOrderId: number | null;
}

interface EquipmentMaintenanceProps {
  schedules: MaintenanceScheduleItem[];
}

export function EquipmentMaintenance({ schedules }: EquipmentMaintenanceProps) {
  const now = new Date();

  const overdueSchedules = schedules.filter(
    (s) => s.nextDueDate <= now && !s.workOrderId
  );
  const upcomingSchedules = schedules.filter(
    (s) => s.nextDueDate > now || s.workOrderId
  );

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border-2 border-zinc-200">
          <Calendar className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mt-4 text-lg font-black text-zinc-900">No Schedules</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-xs">
          No preventive maintenance schedules have been set up for this equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue / Due Now */}
      {overdueSchedules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-danger-500 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Needs Attention
          </h3>
          {overdueSchedules.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} isOverdue />
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcomingSchedules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Upcoming
          </h3>
          {upcomingSchedules.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleCard({
  schedule,
  isOverdue,
}: {
  schedule: MaintenanceScheduleItem;
  isOverdue?: boolean;
}) {
  const daysUntilDue = Math.ceil(
    (schedule.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        isOverdue
          ? "border-danger-300 bg-danger-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-black ${
                isOverdue ? "text-danger-700" : "text-zinc-900"
              }`}
            >
              {schedule.name}
            </span>
            <span className="text-xs font-bold uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
              {schedule.type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            {isOverdue ? (
              <span className="text-danger-600 font-bold">
                Overdue by {Math.abs(daysUntilDue)} days
              </span>
            ) : daysUntilDue <= 7 ? (
              <span className="text-warning-600 font-bold">
                Due in {daysUntilDue} days
              </span>
            ) : (
              <span>Due {formatRelativeTime(schedule.nextDueDate)}</span>
            )}
          </div>
        </div>

        {schedule.workOrderId ? (
          <Button asChild variant="outline" className="rounded-xl font-bold">
            <Link href={`/dashboard/work-orders/${schedule.workOrderId}`}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              View WO
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            className={`rounded-xl font-bold ${
              isOverdue
                ? "bg-danger-600 hover:bg-danger-700"
                : "bg-warning-600 hover:bg-warning-700"
            }`}
          >
            <Link href={`/dashboard/maintenance/schedules/${schedule.id}`}>
              Start PM
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
