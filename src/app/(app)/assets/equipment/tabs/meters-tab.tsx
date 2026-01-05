"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldGroup } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentMeter } from "@/db/schema";
import { Gauge, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

interface MetersTabProps {
  equipmentId?: string;
  meters: EquipmentMeter[];
  isNew?: boolean;
  onCreateMeter?: (data: {
    name: string;
    type: string;
    unit: string;
    currentReading?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onUpdateMeter?: (
    meterId: string,
    data: { name: string; type: string; unit: string; currentReading?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteMeter?: (meterId: string) => Promise<{ success: boolean; error?: string }>;
}

const METER_TYPES = [
  { value: "hours", label: "Hours", defaultUnit: "hrs" },
  { value: "miles", label: "Miles", defaultUnit: "mi" },
  { value: "kilometers", label: "Kilometers", defaultUnit: "km" },
  { value: "cycles", label: "Cycles", defaultUnit: "cycles" },
  { value: "units", label: "Units", defaultUnit: "units" },
];

export function MetersTab({
  equipmentId,
  meters,
  isNew,
  onCreateMeter,
  onUpdateMeter,
  onDeleteMeter,
}: MetersTabProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<EquipmentMeter | null>(null);
  const [deletingMeter, setDeletingMeter] = useState<EquipmentMeter | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [unit, setUnit] = useState("");
  const [currentReading, setCurrentReading] = useState("");

  const resetForm = () => {
    setName("");
    setType("");
    setUnit("");
    setCurrentReading("");
    setEditingMeter(null);
    setError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (meter: EquipmentMeter) => {
    setEditingMeter(meter);
    setName(meter.name);
    setType(meter.type);
    setUnit(meter.unit);
    setCurrentReading(meter.currentReading || "");
    setError(null);
    setDialogOpen(true);
  };

  const handleOpenDelete = (meter: EquipmentMeter) => {
    setDeletingMeter(meter);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !type || !unit) {
      setError("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          name,
          type,
          unit,
          currentReading: currentReading || undefined,
        };

        const result = editingMeter
          ? await onUpdateMeter?.(editingMeter.id, data)
          : await onCreateMeter?.(data);

        if (result && !result.success) {
          setError(result.error || "Failed to save meter");
          return;
        }

        setDialogOpen(false);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingMeter) return;

    startTransition(async () => {
      try {
        const result = await onDeleteMeter?.(deletingMeter.id);
        if (result && !result.success) {
          setError(result.error || "Failed to delete meter");
          return;
        }
        setDeleteDialogOpen(false);
        setDeletingMeter(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  if (isNew) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Meters can be configured after the equipment is created. Save the
            equipment first, then return to this tab to add meter tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Track usage metrics like operating hours, mileage, or production cycles.
          Multiple meters can be configured per equipment for comprehensive tracking.
        </p>
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Configured Meters ({meters.length})
        </h3>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Add Meter
        </Button>
      </div>

      {/* Meters List */}
      {meters.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((meter) => (
            <div
              key={meter.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Gauge className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{meter.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {meter.type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleOpenEdit(meter)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-danger-600 hover:text-danger-700"
                    onClick={() => handleOpenDelete(meter)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Current Reading
                </p>
                <p className="text-xl font-bold">
                  {meter.currentReading
                    ? `${parseFloat(meter.currentReading).toLocaleString()} ${meter.unit}`
                    : "Not recorded"}
                </p>
                {meter.lastReadingDate && (
                  <p className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(meter.lastReadingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Gauge}
          title="No meters configured"
          description="Add meters to track equipment usage like operating hours, mileage, or production cycles."
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMeter ? "Edit Meter" : "Add Meter"}
            </DialogTitle>
            <DialogDescription>
              Configure a meter to track equipment usage over time.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <FieldGroup label="Meter Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engine Hours, Odometer"
                required
              />
            </FieldGroup>

            <FieldGroup label="Meter Type" required>
              <Select
                value={type}
                onValueChange={(val) => {
                  setType(val);
                  const meterType = METER_TYPES.find((t) => t.value === val);
                  if (meterType && !unit) {
                    setUnit(meterType.defaultUnit);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {METER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup label="Unit" required>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., hrs, mi, km"
                required
              />
            </FieldGroup>

            <FieldGroup
              label="Current Reading"
              description="Optional - set the starting value"
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                placeholder="0"
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMeter ? "Save Changes" : "Add Meter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the meter "{deletingMeter?.name}"?
              This will also delete all associated readings. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingMeter(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Meter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
