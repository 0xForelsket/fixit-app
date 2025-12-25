"use client";

import { Button } from "@/components/ui/button";
import type {
  Machine,
  MaintenanceChecklist,
  MaintenanceSchedule,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ScheduleFormProps {
  schedule?: MaintenanceSchedule & {
    machine?: Machine | null;
  };
  checklists?: MaintenanceChecklist[];
  machines: Machine[];
  isNew?: boolean;
}

export function ScheduleForm({
  schedule,
  checklists = [],
  machines,
  isNew,
}: ScheduleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(schedule?.title || "");
  const [machineId, setMachineId] = useState(
    schedule?.machineId?.toString() || ""
  );
  const [type, setType] = useState<"maintenance" | "calibration">(
    schedule?.type || "maintenance"
  );
  const [frequencyDays, setFrequencyDays] = useState(
    schedule?.frequencyDays?.toString() || "30"
  );
  const [isActive, setIsActive] = useState(schedule?.isActive ?? true);

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<
    Array<{
      id?: number;
      stepNumber: number;
      description: string;
      isRequired: boolean;
      estimatedMinutes: number | null;
    }>
  >(
    checklists.map((c) => ({
      id: c.id,
      stepNumber: c.stepNumber,
      description: c.description,
      isRequired: c.isRequired,
      estimatedMinutes: c.estimatedMinutes,
    }))
  );

  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      {
        stepNumber: checklistItems.length + 1,
        description: "",
        isRequired: true,
        estimatedMinutes: null,
      },
    ]);
  };

  const removeChecklistItem = (index: number) => {
    const newItems = checklistItems.filter((_, i) => i !== index);
    // Renumber steps
    setChecklistItems(
      newItems.map((item, i) => ({ ...item, stepNumber: i + 1 }))
    );
  };

  const updateChecklistItem = (
    index: number,
    updates: Partial<(typeof checklistItems)[0]>
  ) => {
    setChecklistItems(
      checklistItems.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        machineId: Number.parseInt(machineId),
        type,
        frequencyDays: Number.parseInt(frequencyDays),
        isActive,
        checklists: checklistItems.filter((item) => item.description.trim()),
      };

      const url = isNew
        ? "/api/maintenance/schedules"
        : `/api/maintenance/schedules/${schedule?.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save schedule");
      }

      router.push("/dashboard/maintenance/schedules");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/maintenance/schedules/${schedule?.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete schedule");
      }

      router.push("/dashboard/maintenance/schedules");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/dashboard/maintenance/schedules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Schedule" : "Edit Schedule"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Create a new maintenance schedule" : schedule?.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Schedule Details */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Schedule Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Monthly Inspection"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="machine" className="mb-1 block text-sm font-medium">
              Machine
            </label>
            <select
              id="machine"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select machine...</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "maintenance" | "calibration")
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="maintenance">Maintenance</option>
              <option value="calibration">Calibration</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="frequency"
              className="mb-1 block text-sm font-medium"
            >
              Frequency (days)
            </label>
            <input
              id="frequency"
              type="number"
              min="1"
              value={frequencyDays}
              onChange={(e) => setFrequencyDays(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
                isActive ? "bg-primary-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full bg-white shadow transition-transform",
                  isActive && "translate-x-5"
                )}
              />
            </button>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Checklist Steps</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChecklistItem}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>

        {checklistItems.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No checklist steps yet. Add steps to create a maintenance
              procedure.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={addChecklistItem}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Step
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {checklistItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium">
                  {item.stepNumber}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateChecklistItem(index, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Step description..."
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          updateChecklistItem(index, {
                            isRequired: !item.isRequired,
                          })
                        }
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border",
                          item.isRequired
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {item.isRequired && <Check className="h-3 w-3" />}
                      </button>
                      Required
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={item.estimatedMinutes || ""}
                        onChange={(e) =>
                          updateChecklistItem(index, {
                            estimatedMinutes: e.target.value
                              ? Number.parseInt(e.target.value)
                              : null,
                          })
                        }
                        placeholder="Est. min"
                        className="w-20 rounded border bg-white px-2 py-1 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">
                        minutes
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-rose-600"
                  onClick={() => removeChecklistItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {checklistItems.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Total estimated time:{" "}
            <span className="font-medium">
              {checklistItems.reduce(
                (sum, item) => sum + (item.estimatedMinutes || 0),
                0
              )}{" "}
              minutes
            </span>
          </div>
        )}
      </div>
    </form>
  );
}
