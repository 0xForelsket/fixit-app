"use client";

import { Button } from "@/components/ui/button";
import type { LaborLog, User } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Clock, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TimeLoggerProps {
  ticketId: number;
  userId: number;
  userHourlyRate?: number | null;
  existingLogs?: (LaborLog & { user?: User })[];
}

export function TimeLogger({
  ticketId,
  userId,
  userHourlyRate,
  existingLogs = [],
}: TimeLoggerProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const [notes, setNotes] = useState("");

  // Check for active timer in localStorage
  useEffect(() => {
    const savedTimer = localStorage.getItem(`timer-${ticketId}`);
    if (savedTimer) {
      const { start } = JSON.parse(savedTimer);
      const savedStart = new Date(start);
      setStartTime(savedStart);
      setIsRunning(true);
      setElapsed(Math.floor((Date.now() - savedStart.getTime()) / 1000));
    }
  }, [ticketId]);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsed(0);
    localStorage.setItem(
      `timer-${ticketId}`,
      JSON.stringify({ start: now.toISOString() })
    );
  };

  const handleStop = async () => {
    if (!startTime) return;

    setSaving(true);
    try {
      const endTime = new Date();
      const durationMinutes = Math.ceil(
        (endTime.getTime() - startTime.getTime()) / 60000
      );

      const res = await fetch("/api/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          userId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
          hourlyRate: userHourlyRate,
          notes,
          isBillable: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save time entry");

      localStorage.removeItem(`timer-${ticketId}`);
      setIsRunning(false);
      setStartTime(null);
      setElapsed(0);
      setNotes("");
      router.refresh();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualMinutes) return;

    setSaving(true);
    try {
      const now = new Date();
      const durationMinutes = Number.parseInt(manualMinutes);

      const res = await fetch("/api/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          userId,
          startTime: now.toISOString(),
          endTime: now.toISOString(),
          durationMinutes,
          hourlyRate: userHourlyRate,
          notes,
          isBillable: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save time entry");

      setShowManualEntry(false);
      setManualMinutes("");
      setNotes("");
      router.refresh();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logId: number) => {
    if (!confirm("Delete this time entry?")) return;

    try {
      const res = await fetch(`/api/labor/${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (error) {
      console.error("Error deleting time entry:", error);
    }
  };

  // Calculate totals
  const totalMinutes = existingLogs.reduce(
    (sum, log) => sum + (log.durationMinutes || 0),
    0
  );
  const totalCost = existingLogs.reduce((sum, log) => {
    if (!log.durationMinutes || !log.hourlyRate) return sum;
    return sum + (log.durationMinutes / 60) * log.hourlyRate;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              isRunning ? "bg-primary-100" : "bg-slate-200"
            )}
          >
            <Clock
              className={cn(
                "h-6 w-6",
                isRunning ? "text-primary-600" : "text-slate-500"
              )}
            />
          </div>
          <div>
            <p className="text-2xl font-mono font-bold">
              {formatTime(elapsed)}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRunning ? "Timer running..." : "Timer stopped"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isRunning ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              disabled={saving}
            >
              <Pause className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Stop"}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleStart}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManualEntry(!showManualEntry)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Manual
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notes input when timer running */}
      {isRunning && (
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about your work..."
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      )}

      {/* Manual Entry Form */}
      {showManualEntry && !isRunning && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <h4 className="font-medium">Manual Time Entry</h4>
          <div className="flex gap-3">
            <input
              type="number"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              placeholder="Minutes"
              min="1"
              className="w-24 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <Button
              onClick={handleManualEntry}
              disabled={!manualMinutes || saving}
            >
              Add Entry
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      {existingLogs.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-white p-3 text-center">
            <p className="text-2xl font-bold text-primary-600">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
          <div className="rounded-lg border bg-white p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${totalCost.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Labor Cost</p>
          </div>
        </div>
      )}

      {/* Time Entries List */}
      {existingLogs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">
            Time Entries
          </h4>
          {existingLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div>
                <p className="font-medium">
                  {log.durationMinutes} min
                  {log.hourlyRate && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      • $
                      {(
                        ((log.durationMinutes || 0) / 60) *
                        log.hourlyRate
                      ).toFixed(2)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {log.user?.name || "Unknown"} •{" "}
                  {log.createdAt
                    ? new Date(log.createdAt).toLocaleDateString()
                    : ""}
                  {log.notes && ` • ${log.notes}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-rose-600"
                onClick={() => handleDelete(log.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
