"use client";

import {
  createReportSchedule,
  deleteReportSchedule,
  getSchedulesForTemplate,
  toggleScheduleActive,
} from "@/actions/report-schedules";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportFrequency, ReportSchedule } from "@/db/schema";
import {
  Calendar,
  Clock,
  Loader2,
  Mail,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface ScheduleDialogProps {
  templateId: string;
  templateName: string;
}

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export function ScheduleDialog({
  templateId,
  templateName,
}: ScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // New schedule form state
  const [frequency, setFrequency] = useState<ReportFrequency>("weekly");
  const [timezone, setTimezone] = useState("UTC");
  const [recipients, setRecipients] = useState<string[]>([""]);

  const loadSchedules = async () => {
    setIsLoading(true);
    const result = await getSchedulesForTemplate(templateId);
    if (result.success && result.data) {
      setSchedules(result.data);
    }
    setIsLoading(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadSchedules depends on templateId which is stable for the dialog lifetime
  useEffect(() => {
    if (open) {
      loadSchedules();
    }
  }, [open]);

  const addRecipientField = () => {
    setRecipients([...recipients, ""]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const handleCreate = () => {
    setError(null);
    const validRecipients = recipients.filter((r) => r.trim() !== "");

    if (validRecipients.length === 0) {
      setError("At least one recipient is required");
      return;
    }

    startTransition(async () => {
      const result = await createReportSchedule({
        templateId,
        frequency,
        recipients: validRecipients,
        timezone,
      });

      if (result.success) {
        setRecipients([""]);
        setFrequency("weekly");
        loadSchedules();
      } else {
        setError(result.error || "Failed to create schedule");
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleScheduleActive(id);
      loadSchedules();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    startTransition(async () => {
      await deleteReportSchedule(id);
      loadSchedules();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Report: {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Schedules */}
          <div>
            <h3 className="font-semibold mb-3">Active Schedules</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No schedules configured</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          schedule.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <div>
                        <div className="font-medium capitalize">
                          {schedule.frequency}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(schedule.recipients as string[]).join(", ")}
                        </div>
                        {schedule.nextRunAt && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Next:{" "}
                            {new Date(schedule.nextRunAt).toLocaleString()}
                          </div>
                        )}
                        {schedule.lastError && (
                          <div className="text-xs text-red-500 mt-1">
                            Error: {schedule.lastError}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(schedule.id)}
                        disabled={isPending}
                        title={schedule.isActive ? "Pause" : "Resume"}
                      >
                        {schedule.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(schedule.id)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Schedule */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Create New Schedule</h3>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as ReportFrequency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="space-y-2">
                  {recipients.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                      />
                      {recipients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipientField}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Recipient
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                onClick={handleCreate}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
