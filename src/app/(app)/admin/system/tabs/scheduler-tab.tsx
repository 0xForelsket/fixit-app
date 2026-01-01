"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Calendar, Clock, Play, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface MaintenanceSchedule {
  id: string;
  title: string;
  equipmentName: string;
  frequencyDays: number;
  nextDue: Date;
  lastGenerated: Date | null;
  isActive: boolean;
}

interface SchedulerTabProps {
  schedules: MaintenanceSchedule[];
  overdueCount: number;
  upcomingCount: number;
}

export function SchedulerTab({ schedules, overdueCount, upcomingCount }: SchedulerTabProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    generated: number;
    escalated: number;
    errors?: string[];
  } | null>(null);

  const runScheduler = async () => {
    setIsRunning(true);
    setLastResult(null);

    try {
      const csrfResponse = await fetch("/api/csrf");
      const { token } = await csrfResponse.json();

      const response = await fetch("/api/scheduler/run", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          generated: result.generated,
          escalated: result.escalated,
          errors: result.errors,
        });
      } else {
        setLastResult({
          success: false,
          generated: 0,
          escalated: 0,
          errors: [result.error || "Unknown error"],
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        generated: 0,
        escalated: 0,
        errors: [error instanceof Error ? error.message : "Network error"],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const now = new Date();
  const overdueSchedules = schedules.filter(
    (s) => s.isActive && new Date(s.nextDue) < now
  );
  const upcomingSchedules = schedules.filter(
    (s) => s.isActive && new Date(s.nextDue) >= now
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Overdue Schedules
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Upcoming This Week
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{schedules.filter((s) => s.isActive).length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Active Schedules
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Run Scheduler Section */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Manual Scheduler Run</h3>
            <p className="text-sm text-muted-foreground">
              Process all due maintenance schedules and escalate overdue work orders
            </p>
          </div>
          <Button onClick={runScheduler} disabled={isRunning} className="shrink-0">
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Now
              </>
            )}
          </Button>
        </div>

        {lastResult && (
          <div
            className={`mt-4 rounded-lg p-4 ${
              lastResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    lastResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {lastResult.success ? "Scheduler run completed" : "Scheduler run failed"}
                </p>
                {lastResult.success && (
                  <p className="text-sm text-green-700 mt-1">
                    Generated {lastResult.generated} work order(s), escalated{" "}
                    {lastResult.escalated} overdue work order(s)
                  </p>
                )}
                {lastResult.errors && lastResult.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {lastResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overdue Schedules */}
      {overdueSchedules.length > 0 && (
        <div className="rounded-xl border bg-white">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Schedules ({overdueSchedules.length})
            </h3>
          </div>
          <div className="divide-y">
            {overdueSchedules.slice(0, 10).map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} isOverdue />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Schedules */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Schedules
          </h3>
        </div>
        {upcomingSchedules.length > 0 ? (
          <div className="divide-y">
            {upcomingSchedules.slice(0, 10).map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No upcoming schedules
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleRow({
  schedule,
  isOverdue = false,
}: {
  schedule: MaintenanceSchedule;
  isOverdue?: boolean;
}) {
  const nextDue = new Date(schedule.nextDue);
  const now = new Date();
  const diffDays = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{schedule.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {schedule.equipmentName} • Every {schedule.frequencyDays} days
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <Badge variant={isOverdue ? "destructive" : diffDays <= 1 ? "warning" : "secondary"}>
          {isOverdue
            ? `${Math.abs(diffDays)} day(s) overdue`
            : diffDays === 0
            ? "Due today"
            : `Due in ${diffDays} day(s)`}
        </Badge>
      </div>
    </div>
  );
}
