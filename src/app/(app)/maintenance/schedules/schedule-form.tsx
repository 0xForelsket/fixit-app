"use client";

import {
  createScheduleAction,
  updateScheduleAction,
} from "@/actions/maintenance";
import { getMeters } from "@/actions/meters"; // Import getMeters
import { Button } from "@/components/ui/button";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { FieldGroup, FormGrid, FormSection } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Equipment,
  EquipmentMeter,
  MaintenanceChecklist,
  MaintenanceSchedule,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { insertMaintenanceScheduleSchema } from "@/lib/validations/schedules";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, GripVertical, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";

type ScheduleFormValues = z.infer<typeof insertMaintenanceScheduleSchema>;

interface ScheduleFormProps {
  schedule?: MaintenanceSchedule & {
    equipment?: Equipment | null;
  };
  checklists?: MaintenanceChecklist[];
  equipment: Equipment[];
  isNew?: boolean;
}

export function ScheduleForm({
  schedule,
  checklists = [],
  equipment,
  isNew,
}: ScheduleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [meters, setMeters] = useState<EquipmentMeter[]>([]);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(insertMaintenanceScheduleSchema),
    defaultValues: {
      title: schedule?.title || "",
      equipmentId: schedule?.equipmentId || undefined,
      type: (schedule?.type as "maintenance" | "calibration") || "maintenance",
      frequencyDays: schedule?.frequencyDays || 30,
      meterId: schedule?.meterId || null,
      meterInterval: schedule?.meterInterval || null,
      isActive: schedule?.isActive ?? true,
      checklists:
        checklists.length > 0
          ? checklists.map((c) => ({
              id: c.id,
              stepNumber: c.stepNumber,
              description: c.description,
              isRequired: c.isRequired,
              estimatedMinutes: c.estimatedMinutes,
            }))
          : [],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = form;

  const selectedEquipmentId = watch("equipmentId");

  useEffect(() => {
    async function loadMeters() {
      if (selectedEquipmentId) {
        const result = await getMeters(selectedEquipmentId);
        if (result.success && result.data) {
          setMeters(result.data as EquipmentMeter[]);
        } else {
          setMeters([]);
        }
      } else {
        setMeters([]);
      }
    }
    loadMeters();
  }, [selectedEquipmentId]);

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "checklists",
  });

  // Watch checklists to calculate total time
  const watchedChecklists = watch("checklists");

  const onSubmit = async (data: ScheduleFormValues) => {
    setSaving(true);
    setDeleteError(null);

    try {
      // Filter out empty descriptions if that was the desired behavior
      const cleanedData = {
        ...data,
        checklists:
          data.checklists?.filter((item) => item.description.trim()) || [],
      };

      // Manually re-index steps to ensure 1,2,3 order before save
      cleanedData.checklists = cleanedData.checklists.map((item, index) => ({
        ...item,
        stepNumber: index + 1,
      }));

      const result = isNew
        ? await createScheduleAction(cleanedData)
        : await updateScheduleAction(schedule!.id, cleanedData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect is handled in Server Action, but we can prevent further interaction here
    } catch (err) {
      console.error(err);
      form.setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong",
      });
      setSaving(false); // Only reset if error, success redirects
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormErrorSummary
        error={errors.root?.message || deleteError || undefined}
        formErrors={errors}
        onDismiss={() => {
          form.clearErrors("root");
          setDeleteError(null);
        }}
      />

      <FormGrid>
        <FieldGroup label="Title" required error={errors.title?.message}>
          <Input
            id="title"
            {...register("title")}
            placeholder="e.g., Monthly Inspection"
            className={cn(errors.title && "border-danger-500")}
          />
        </FieldGroup>

        <FieldGroup
          label="Equipment"
          required
          error={errors.equipmentId?.message}
        >
          <Select
            value={watch("equipmentId")}
            onValueChange={(val) => setValue("equipmentId", val)}
          >
            <SelectTrigger
              className={cn(errors.equipmentId && "border-danger-500")}
            >
              <SelectValue placeholder="Select equipment..." />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Type" error={errors.type?.message}>
          <Select
            value={watch("type")}
            onValueChange={(val) =>
              setValue("type", val as "maintenance" | "calibration")
            }
          >
            <SelectTrigger className={cn(errors.type && "border-danger-500")}>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="calibration">Calibration</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="col-span-full">
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Trigger Type
          </span>
          <div className="flex items-center gap-4 mt-2">
            <Button
              type="button"
              variant={!watch("meterId") ? "default" : "outline"}
              onClick={() => {
                setValue("meterId", null);
                setValue("meterInterval", null);
                // Set default frequency if missing
                if (!getValues("frequencyDays")) {
                  setValue("frequencyDays", 30);
                }
              }}
              className="h-9"
            >
              Time Based
            </Button>
            <Button
              type="button"
              variant={watch("meterId") ? "default" : "outline"}
              onClick={() => {
                setValue("frequencyDays", null);
                // If meters exist, select first?
                if (meters.length > 0 && !getValues("meterId")) {
                  setValue("meterId", meters[0].id);
                }
              }}
              className="h-9"
            >
              Usage Based
            </Button>
          </div>
        </div>

        {!watch("meterId") ? (
          <FieldGroup
            label="Frequency (days)"
            error={errors.frequencyDays?.message}
          >
            <Input
              type="number"
              min="1"
              {...register("frequencyDays", { valueAsNumber: true })}
              className={cn(errors.frequencyDays && "border-danger-500")}
            />
          </FieldGroup>
        ) : (
          <>
            <FieldGroup label="Meter" required error={errors.meterId?.message}>
              <Select
                value={watch("meterId") || ""}
                onValueChange={(val) => setValue("meterId", val)}
              >
                <SelectTrigger
                  className={cn(errors.meterId && "border-danger-500")}
                >
                  <SelectValue placeholder="Select meter..." />
                </SelectTrigger>
                <SelectContent>
                  {meters.map((meter) => (
                    <SelectItem key={meter.id} value={meter.id}>
                      {meter.name} ({meter.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup
              label="Interval"
              required
              error={errors.meterInterval?.message}
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  {...register("meterInterval", { valueAsNumber: true })}
                  className={cn(errors.meterInterval && "border-danger-500")}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {meters.find((m) => m.id === watch("meterId"))?.unit ||
                    "units"}
                </span>
              </div>
            </FieldGroup>
          </>
        )}

        <div className="flex items-center gap-3 md:col-span-2 pt-2">
          <button
            type="button"
            onClick={() => {
              const current = form.getValues("isActive");
              form.setValue("isActive", !current, { shouldDirty: true });
            }}
            className={cn(
              "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
              watch("isActive") ? "bg-primary-600" : "bg-zinc-200"
            )}
          >
            <span
              className={cn(
                "h-4 w-4 rounded-full bg-white shadow transition-transform",
                watch("isActive") && "translate-x-5"
              )}
            />
          </button>
          <span className="text-sm font-medium">Active Schedule</span>
        </div>
      </FormGrid>

      <FormSection title="Procedure Checklist">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm hover:border-primary/20 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground/40 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                {index + 1}
              </div>
              <div className="flex-1 space-y-3">
                <Input
                  {...register(`checklists.${index}.description`)}
                  placeholder="Describe this step..."
                  className={cn(
                    "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary shadow-none",
                    errors.checklists?.[index]?.description &&
                      "border-danger-500"
                  )}
                />
                {errors.checklists?.[index]?.description && (
                  <p className="text-xs text-danger-500">
                    {errors.checklists[index]?.description?.message}
                  </p>
                )}

                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      const currentItem = watchedChecklists?.[index];
                      if (!currentItem) return;
                      const current = currentItem.isRequired ?? true;
                      update(index, {
                        ...currentItem,
                        isRequired: !current,
                      });
                    }}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        watchedChecklists?.[index]?.isRequired
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {watchedChecklists?.[index]?.isRequired && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    Required
                  </button>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      {...register(`checklists.${index}.estimatedMinutes`, {
                        valueAsNumber: true,
                      })}
                      placeholder="0"
                      className="w-16 h-7 text-xs text-center"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Mins
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:bg-danger-50 hover:text-danger-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              append({
                stepNumber: fields.length + 1,
                description: "",
                isRequired: true,
                estimatedMinutes: null,
              });
            }}
            className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/50"
          >
            + Add Step
          </Button>
        </div>

        {fields.length > 0 && (
          <div className="mt-4 text-xs font-medium text-muted-foreground text-right border-t pt-4">
            Total estimated time:{" "}
            <span className="text-foreground">
              {(watchedChecklists || []).reduce(
                (sum, item) => sum + (Number(item?.estimatedMinutes) || 0),
                0
              )}{" "}
              min
            </span>
          </div>
        )}
      </FormSection>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/maintenance/schedules")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isNew ? "Create Schedule" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
