import { cn, formatRelativeTime } from "@/lib/utils";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
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
          No preventive maintenance schedules have been set up for this
          equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue / Due Now */}
      {overdueSchedules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-danger-500 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Priority Maintenance
          </h3>
          {overdueSchedules.map((schedule) => (
            <ScheduleCondensedCard key={schedule.id} schedule={schedule} isOverdue />
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcomingSchedules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Scheduled PMs
          </h3>
          {upcomingSchedules.map((schedule) => (
            <ScheduleCondensedCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleCondensedCard({
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
      className={cn(
        "rounded-xl border p-3 flex items-center justify-between gap-4 transition-all",
        isOverdue
          ? "border-danger-200 bg-danger-50/30"
          : "border-zinc-200 bg-white shadow-sm"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={cn(
              "font-bold text-sm truncate",
              isOverdue ? "text-danger-700" : "text-zinc-900"
            )}
          >
            {schedule.name}
          </h4>
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
            {schedule.type}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <Clock className="h-3 w-3 text-zinc-300" />
          {isOverdue ? (
            <span className="text-danger-600 uppercase tracking-wider">
              Overdue {Math.abs(daysUntilDue)}d
            </span>
          ) : daysUntilDue <= 7 ? (
            <span className="text-warning-600 uppercase tracking-wider">
              Due in {daysUntilDue}d
            </span>
          ) : (
            <span className="text-zinc-400 uppercase tracking-wider">Due {formatRelativeTime(schedule.nextDueDate)}</span>
          )}
        </div>
      </div>

      {schedule.workOrderId ? (
        <Link
          href={`/maintenance/work-orders/${schedule.workOrderId}`}
          className="flex h-8 px-3 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm"
        >
          View WO
        </Link>
      ) : (
        <Link
          href={`/maintenance/schedules/${schedule.id}`}
          className={cn(
            "flex h-8 px-4 items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-sm active:scale-95",
            isOverdue
              ? "bg-danger-600 hover:bg-danger-700"
              : "bg-warning-600 hover:bg-warning-700"
          )}
        >
          Start
        </Link>
      )}
    </div>
  );
}
