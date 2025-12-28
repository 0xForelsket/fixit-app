import { useToast } from "@/components/ui/use-toast";
import type { LaborLog, User } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseTimeLoggerProps {
  workOrderId: number;
  userId: number;
  userHourlyRate?: number | null;
  existingLogs?: (LaborLog & { user?: User })[];
}

export function useTimeLogger({
  workOrderId,
  userId,
  userHourlyRate,
  existingLogs = [],
}: UseTimeLoggerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  // Load saved timer on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem(`timer-${workOrderId}`);
    if (savedTimer) {
      try {
        const { start } = JSON.parse(savedTimer);
        const savedStart = new Date(start);
        if (!isNaN(savedStart.getTime())) {
          setStartTime(savedStart);
          setIsRunning(true);
          setElapsed(Math.floor((Date.now() - savedStart.getTime()) / 1000));
        }
      } catch (e) {
        console.error("Failed to parse saved timer", e);
      }
    }
  }, [workOrderId]);

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

  const handleStart = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsed(0);
    localStorage.setItem(
      `timer-${workOrderId}`,
      JSON.stringify({ start: now.toISOString() })
    );
  }, [workOrderId]);

  const handleStop = useCallback(
    async (notes: string) => {
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
            workOrderId,
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

        localStorage.removeItem(`timer-${workOrderId}`);
        setIsRunning(false);
        setStartTime(null);
        setElapsed(0);
        router.refresh();
        toast({
          title: "Time Logged",
          description: `Logged ${durationMinutes} minutes.`,
        });
      } catch (error) {
        console.error("Error saving time entry:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save time entry.",
        });
      } finally {
        setSaving(false);
      }
    },
    [startTime, workOrderId, userId, userHourlyRate, router, toast]
  );

  const saveManualEntry = useCallback(
    async (minutes: number, notes: string) => {
      setSaving(true);
      try {
        const now = new Date();
        const res = await fetch("/api/labor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workOrderId,
            userId,
            startTime: now.toISOString(),
            endTime: now.toISOString(),
            durationMinutes: minutes,
            hourlyRate: userHourlyRate,
            notes,
            isBillable: true,
          }),
        });

        if (!res.ok) throw new Error("Failed to save time entry");

        router.refresh();
        toast({
          title: "Manual Entry Added",
          description: `Logged ${minutes} minutes.`,
        });
        return true;
      } catch (error) {
        console.error("Error saving time entry:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save time entry.",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [workOrderId, userId, userHourlyRate, router, toast]
  );

  const deleteLog = useCallback(
    async (logId: number) => {
      if (!confirm("Delete this time entry?")) return;

      try {
        const res = await fetch(`/api/labor/${logId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        router.refresh();
        toast({
          title: "Entry Deleted",
          description: "Labor log removed.",
        });
      } catch (error) {
        console.error("Error deleting time entry:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete entry.",
        });
      }
    },
    [router, toast]
  );

  return {
    isRunning,
    elapsed,
    saving,
    handleStart,
    handleStop,
    saveManualEntry,
    deleteLog,
  };
}
