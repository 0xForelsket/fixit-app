"use client";

import { useTimeLogger } from "@/hooks/use-time-logger";
import { LaborHistory } from "./time-logger/labor-history";
import { LaborSummary } from "./time-logger/labor-summary";
import { ManualEntryForm } from "./time-logger/manual-entry-form";
import { TimerDisplay } from "./time-logger/timer-display";
import { useState } from "react";
import type { LaborLog, User } from "@/db/schema";

interface TimeLoggerProps {
  workOrderId: number;
  userId: number;
  userHourlyRate?: number | null;
  existingLogs?: (LaborLog & { user?: User })[];
}

export function TimeLogger({
  workOrderId,
  userId,
  userHourlyRate,
  existingLogs = [],
}: TimeLoggerProps) {
  const {
    isRunning,
    elapsed,
    saving,
    handleStart,
    handleStop,
    saveManualEntry,
    deleteLog,
  } = useTimeLogger({ workOrderId, userId, userHourlyRate, existingLogs });

  const [showManualEntry, setShowManualEntry] = useState(false);

  return (
    <div className="space-y-4">
      <TimerDisplay
        isRunning={isRunning}
        elapsedSeconds={elapsed}
        saving={saving}
        onStart={handleStart}
        onStop={handleStop}
        onToggleManual={() => setShowManualEntry(!showManualEntry)}
      />

      <ManualEntryForm
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSubmit={saveManualEntry}
        saving={saving}
      />

      <LaborSummary logs={existingLogs} />

      <LaborHistory logs={existingLogs} onDelete={deleteLog} />
    </div>
  );
}
