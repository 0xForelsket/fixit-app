"use client";

import {
  createWorkOrderTemplate,
  deleteWorkOrderTemplate,
  updateWorkOrderTemplate,
} from "@/actions/workOrderTemplates";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import type { Department, User, WorkOrderTemplate } from "@/db/schema";
import { workOrderPriorities, workOrderTypes } from "@/db/schema";
import { cn } from "@/lib/utils";
import { createWorkOrderTemplateSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowUpCircle,
  Save,
  Scale,
  ShieldAlert,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type TemplateFormValues = z.infer<typeof createWorkOrderTemplateSchema>;

interface TemplateFormProps {
  template?: WorkOrderTemplate & {
    department?: Department | null;
    defaultAssignedTo?: User | null;
  };
  departments: Department[];
  users: User[];
  isNew?: boolean;
}

const typeConfig: Record<
  string,
  { label: string; icon: React.ElementType; description: string }
> = {
  breakdown: {
    label: "Breakdown",
    icon: Zap,
    description: "Equipment is stopped",
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    description: "Routine check/fix",
  },
  calibration: {
    label: "Calibration",
    icon: Scale,
    description: "Accuracy adjustment",
  },
  safety: {
    label: "Safety",
    icon: ShieldAlert,
    description: "Hazard reported",
  },
  upgrade: {
    label: "Upgrade",
    icon: ArrowUpCircle,
    description: "Improvement",
  },
  inspection: {
    label: "Inspection",
    icon: Scale, // Reusing Scale or another icon
    description: "System check",
  },
};

const priorityConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: "Low",
    color: "text-primary-700",
    bg: "bg-primary-50",
    border: "border-primary-200",
  },
  medium: {
    label: "Medium",
    color: "text-primary-900",
    bg: "bg-white",
    border: "border-primary-300",
  },
  high: {
    label: "High",
    color: "text-warning-800",
    bg: "bg-warning-50",
    border: "border-warning-300",
  },
  critical: {
    label: "Critical",
    color: "text-white",
    bg: "bg-danger-600",
    border: "border-danger-700",
  },
};

export function TemplateForm({
  template,
  departments,
  users,
  isNew,
}: TemplateFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(createWorkOrderTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      type: template?.type || "maintenance",
      priority: template?.priority || "medium",
      defaultTitle: template?.defaultTitle || "",
      defaultDescription: template?.defaultDescription || "",
      defaultAssignedToId: template?.defaultAssignedToId || null,
      departmentId: template?.departmentId || null,
      estimatedMinutes: template?.estimatedMinutes || null,
      isActive: template?.isActive ?? true,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const onSubmit = async (data: TemplateFormValues) => {
    setSaving(true);
    setDeleteError(null);

    try {
      const formData = new FormData();
      formData.set("name", data.name);
      if (data.description) formData.set("description", data.description);
      formData.set("type", data.type);
      formData.set("priority", data.priority);
      if (data.defaultTitle) formData.set("defaultTitle", data.defaultTitle);
      if (data.defaultDescription)
        formData.set("defaultDescription", data.defaultDescription);
      if (data.defaultAssignedToId)
        formData.set(
          "defaultAssignedToId",
          data.defaultAssignedToId.toString()
        );
      if (data.departmentId)
        formData.set("departmentId", data.departmentId.toString());
      if (data.estimatedMinutes)
        formData.set("estimatedMinutes", data.estimatedMinutes.toString());
      formData.set("isActive", data.isActive ? "true" : "false");

      const result = isNew
        ? await createWorkOrderTemplate(undefined, formData)
        : await updateWorkOrderTemplate(template!.id, undefined, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/maintenance/templates");
      router.refresh();
    } catch (err) {
      console.error(err);
      form.setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong",
      });
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    if (!template?.id) return;

    setSaving(true);
    setDeleteError(null);
    try {
      const result = await deleteWorkOrderTemplate(template.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/maintenance/templates");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
      {/* Header */}
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Templates", href: "/maintenance/templates" },
            { label: isNew ? "New" : template?.name || "Edit" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" asChild>
              <Link href="/maintenance/templates">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isNew ? "New Template" : "Edit Template"}
              </h1>
              <p className="text-muted-foreground">
                {isNew
                  ? "Create a reusable work order template"
                  : template?.name}
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
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {(errors.root || deleteError) && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
          {errors.root?.message || deleteError}
        </div>
      )}

      {/* Template Details */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Template Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Template Name *
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              placeholder="e.g., Monthly Inspection"
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                errors.name
                  ? "border-rose-500 focus:ring-rose-200"
                  : "focus:border-primary-500 focus:ring-primary-500/20"
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              {...register("description")}
              placeholder="Brief description of this template"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="department"
              className="mb-1 block text-sm font-medium"
            >
              Department
            </label>
            <select
              id="department"
              {...register("departmentId", { valueAsNumber: true })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="estimatedMinutes"
              className="mb-1 block text-sm font-medium"
            >
              Estimated Time (minutes)
            </label>
            <input
              id="estimatedMinutes"
              type="number"
              min="0"
              {...register("estimatedMinutes", { valueAsNumber: true })}
              placeholder="e.g., 60"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() => {
                const current = form.getValues("isActive");
                setValue("isActive", !current, { shouldDirty: true });
              }}
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
                watch("isActive") ? "bg-primary-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full bg-white shadow transition-transform",
                  watch("isActive") && "translate-x-5"
                )}
              />
            </button>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Work Order Type */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Work Order Type *</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {workOrderTypes.map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const isSelected = watch("type") === type;

            return (
              <label
                key={type}
                className={cn(
                  "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 bg-white p-4 text-center transition-all hover:border-primary-300 hover:bg-primary-50/50 active:scale-[0.98]",
                  isSelected && "border-primary-600 bg-primary-50 shadow-sm"
                )}
              >
                <input
                  type="radio"
                  {...register("type")}
                  value={type}
                  className="sr-only"
                />
                <Icon
                  className={cn(
                    "mb-3 h-8 w-8 text-zinc-400 transition-colors",
                    isSelected && "text-primary-600"
                  )}
                />
                <span
                  className={cn(
                    "font-bold text-foreground",
                    isSelected && "text-primary-700"
                  )}
                >
                  {config.label}
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  {config.description}
                </span>
              </label>
            );
          })}
        </div>
        {errors.type && (
          <p className="mt-2 text-xs text-rose-500">{errors.type.message}</p>
        )}
      </div>

      {/* Priority */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Default Priority</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workOrderPriorities.map((priority) => {
            const config = priorityConfig[priority];
            const isSelected = watch("priority") === priority;

            return (
              <label
                key={priority}
                className={cn(
                  "relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:opacity-95",
                  config.bg,
                  config.border,
                  isSelected && "ring-2 ring-offset-2 ring-offset-background"
                )}
              >
                <input
                  type="radio"
                  {...register("priority")}
                  value={priority}
                  className="sr-only"
                />
                <div className="flex-1">
                  <span
                    className={cn(
                      "font-bold text-lg capitalize block",
                      config.color
                    )}
                  >
                    {priority}
                  </span>
                </div>
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 border-zinc-300 flex items-center justify-center p-0.5",
                    priority === "critical" && "border-danger-300"
                  )}
                >
                  <div
                    className={cn(
                      "h-full w-full rounded-full bg-primary-600 opacity-0 transition-opacity",
                      isSelected && "opacity-100"
                    )}
                  />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Default Values */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Default Work Order Values</h2>
        <div className="grid gap-4">
          <div>
            <label
              htmlFor="defaultTitle"
              className="mb-1 block text-sm font-medium"
            >
              Default Title
            </label>
            <input
              id="defaultTitle"
              type="text"
              {...register("defaultTitle")}
              placeholder="e.g., Monthly Pump Inspection"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This will be the default title when creating a work order from
              this template
            </p>
          </div>

          <div>
            <label
              htmlFor="defaultDescription"
              className="mb-1 block text-sm font-medium"
            >
              Default Description
            </label>
            <textarea
              id="defaultDescription"
              {...register("defaultDescription")}
              rows={4}
              placeholder="Describe the default work order instructions..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="defaultAssignedTo"
              className="mb-1 block text-sm font-medium"
            >
              Default Assigned To
            </label>
            <select
              id="defaultAssignedTo"
              {...register("defaultAssignedToId", { valueAsNumber: true })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">No default assignee</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
