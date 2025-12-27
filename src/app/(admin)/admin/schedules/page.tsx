import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { maintenanceSchedules } from "@/db/schema";
import { cn } from "@/lib/utils";
import { desc } from "drizzle-orm";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Edit,
  Pause,
  Plus,
  Repeat,
} from "lucide-react";
import { SchedulerButton } from "@/components/maintenance/scheduler-button";
import Link from "next/link";

async function getSchedules() {
  return db.query.maintenanceSchedules.findMany({
    orderBy: [desc(maintenanceSchedules.createdAt)],
    with: {
      equipment: true,
    },
  });
}

async function getScheduleStats() {
  const allSchedules = await db.query.maintenanceSchedules.findMany();
  const active = allSchedules.filter((s) => s.isActive);
  const due = allSchedules.filter((s) => {
    if (!s.nextDue) return false;
    return new Date(s.nextDue) <= new Date();
  });
  return {
    total: allSchedules.length,
    active: active.length,
    due: due.length,
  };
}

export default async function SchedulesPage() {
  const schedules = await getSchedules();
  const stats = await getScheduleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Maintenance <span className="text-primary-600">Schedules</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5" />
            {stats.total} ROUTINES • {stats.active} ACTIVE
          </div>
        </div>
        <div className="flex gap-2">
          <SchedulerButton />
          <Button asChild className="font-bold shadow-lg shadow-primary-500/20">
            <Link href="/dashboard/maintenance/schedules/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD SCHEDULE
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Schedules"
          value={stats.total}
          icon={Calendar}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatsCard
          title="Due Now"
          value={stats.due}
          icon={CalendarClock}
          color="text-rose-600"
          bg="bg-rose-50"
        />
      </div>

      {/* Schedules Table */}
      {schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No schedules found</h3>
          <p className="text-sm text-muted-foreground">
            Create your first maintenance schedule to automate ticket creation.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="p-4">Schedule</th>
                <th className="p-4 hidden md:table-cell">Equipment</th>
                <th className="p-4 hidden lg:table-cell">Frequency</th>
                <th className="p-4">Next Due</th>
                <th className="p-4 hidden sm:table-cell">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((schedule) => {
                const isOverdue =
                  schedule.nextDue && new Date(schedule.nextDue) < new Date();

                return (
                  <tr
                    key={schedule.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                          <Repeat className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">{schedule.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {schedule.type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm">
                        {schedule.equipment?.name || "—"}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs">
                        Every {schedule.frequencyDays} days
                      </Badge>
                    </td>
                    <td className="p-4">
                      {schedule.nextDue ? (
                        <span
                          className={cn(
                            "text-sm",
                            isOverdue
                              ? "text-rose-600 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {isOverdue && "⚠️ "}
                          {new Date(schedule.nextDue).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {schedule.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          <Pause className="h-3 w-3" />
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/schedules/${schedule.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4 bg-white">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </div>
  );
}
