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
      {/* Timer Display */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-500",
        isRunning ? "bg-primary-900 border-primary-500 shadow-xl shadow-primary-900/20" : "bg-white border-zinc-200 shadow-sm"
      )}>
        {isRunning && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none animate-pulse" />
        )}
        
        <div className="relative flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isRunning ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-400"
            )}>
                <Clock className={cn("h-5 w-5", isRunning && "animate-spin-slow")} />
            </div>
            <p className={cn(
                "text-xs font-black uppercase tracking-widest",
                isRunning ? "text-primary-400" : "text-zinc-500"
            )}>
                {isRunning ? "Session Active" : "Ready to Log"}
            </p>
          </div>

          <div className="text-center">
            <p className={cn(
                "font-mono text-5xl font-black tracking-tighter sm:text-6xl",
                isRunning ? "text-white" : "text-zinc-900"
            )}>
                {formatTime(elapsed)}
            </p>
            {isRunning && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 animate-pulse">
                    Recording Labor...
                </p>
            )}
          </div>

          <div className="flex w-full gap-3 pt-2">
            {isRunning ? (
                <Button
                    onClick={handleStop}
                    variant="destructive"
                    disabled={saving}
                    className="h-14 flex-1 rounded-xl text-lg font-black uppercase tracking-widest shadow-lg active:scale-95"
                >
                    <Pause className="mr-2 h-6 w-6 fill-current" />
                    {saving ? "Saving..." : "Stop Work"}
                </Button>
            ) : (
                <>
                    <Button
                        onClick={handleStart}
                        className="h-14 flex-[2] rounded-xl bg-primary-600 text-lg font-black uppercase tracking-widest text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-95 transition-all"
                    >
                        <Play className="mr-2 h-6 w-6 fill-current" />
                        Start Timer
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowManualEntry(!showManualEntry)}
                        className="h-14 flex-1 rounded-xl border-2 font-black uppercase tracking-widest active:scale-95"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </>
            )}
          </div>
        </div>
      </div>

      {/* Notes / Manual Entry */}
      {(isRunning || showManualEntry) && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {isRunning ? (
                <div className="relative">
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="What are you working on?"
                        className="w-full rounded-xl border-2 border-primary-100 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-900 placeholder:text-primary-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-ping" />
                    </div>
                </div>
            ) : showManualEntry && (
                <div className="rounded-2xl border-2 bg-white p-4 shadow-xl space-y-4 border-primary-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Plus className="h-4 w-4 text-primary-600" />
                        <h4 className="font-black uppercase tracking-tighter text-zinc-900">Manual Entry</h4>
                    </div>
                    <div className="flex gap-2">
                         <div className="relative flex-1">
                            <input
                                type="number"
                                value={manualMinutes}
                                onChange={(e) => setManualMinutes(e.target.value)}
                                placeholder="Min"
                                min="1"
                                className="w-full rounded-xl border-2 bg-zinc-50 px-4 py-3 text-lg font-black text-zinc-900 focus:border-primary-500 focus:outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-400">Minutes</span>
                         </div>
                    </div>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        className="w-full rounded-xl border-2 bg-zinc-50 px-4 py-3 text-sm font-bold focus:border-primary-500 focus:outline-none"
                    />
                    <Button
                        onClick={handleManualEntry}
                        disabled={!manualMinutes || saving}
                        className="w-full h-12 rounded-xl bg-primary-600 font-black uppercase tracking-widest"
                    >
                        {saving ? "Adding..." : "Confirm Entry"}
                    </Button>
                </div>
            )}
        </div>
      )}

      {/* Summary Stats */}
      {existingLogs.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Labor</p>
            <p className="text-2xl font-black text-primary-600">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
          </div>
          <div className="rounded-2xl border-2 bg-white p-4 shadow-sm">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Estimated Cost</p>
            <p className="text-2xl font-black text-emerald-600">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* History */}
      {existingLogs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">History</h4>
            <span className="text-[10px] font-bold text-zinc-400">{existingLogs.length} Entries</span>
          </div>
          <div className="space-y-2">
            {existingLogs.map((log) => (
              <div
                key={log.id}
                className="group relative flex items-center justify-between rounded-xl border-2 bg-white p-3 shadow-sm transition-all hover:border-zinc-300"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-sm text-zinc-900">
                        {log.durationMinutes}m
                    </p>
                    {log.hourlyRate && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            ${(((log.durationMinutes || 0) / 60) * log.hourlyRate).toFixed(2)}
                        </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                    <span className="truncate max-w-[100px]">{log.user?.name || "Unknown"}</span>
                    <span>•</span>
                    <span>{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                  {log.notes && (
                      <p className="mt-1 text-xs text-zinc-600 line-clamp-1 italic font-medium">"{log.notes}"</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
