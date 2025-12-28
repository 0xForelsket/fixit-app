"use client";

import { createWorkOrder } from "@/actions/workOrders";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/ui/camera-capture";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workOrderPriorities, workOrderTypes } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  ArrowUpCircle,
  Camera,
  CheckCircle2,
  Scale,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

interface ReportFormProps {
  equipment: {
    id: number;
    name: string;
  };
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

export function ReportForm({ equipment }: ReportFormProps) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<
    { filename: string; s3Key: string; mimeType: string; sizeBytes: number }[]
  >([]);
  const [state, formAction, isPending] = useActionState(
    createWorkOrder,
    undefined
  );
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (state?.success) {
      router.push("/my-work-orders?created=true");
    }
  }, [state?.success, router]);

  const handleUploadComplete = (attachment: {
    filename: string;
    s3Key: string;
    mimeType: string;
    sizeBytes: number;
  }) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleCameraCapture = async (blob: Blob, filename: string) => {
    setIsUploadingPhoto(true);
    try {
      // Get presigned URL
      const response = await fetch("/api/attachments/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          mimeType: "image/jpeg",
          entityType: "work_order",
          entityId: equipment.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, s3Key } = await response.json();

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload photo");

      // Add to attachments
      setAttachments((prev) => [
        ...prev,
        {
          s3Key,
          filename,
          mimeType: "image/jpeg",
          sizeBytes: blob.size,
        },
      ]);
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="equipmentId" value={equipment.id} />
      <input
        type="hidden"
        name="attachments"
        value={JSON.stringify(attachments)}
      />

      {/* Error display */}
      {state && !state.success && state.error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-danger-700 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          {state.error}
        </div>
      )}

      {/* Ticket Type */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Issue Type
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {workOrderTypes.map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            return (
              <label
                key={type}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-3 text-center transition-all hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 active:scale-[0.98] shadow-sm"
              >
                <input
                  type="radio"
                  name="type"
                  value={type}
                  className="sr-only"
                  required
                />
                <Icon className="mb-2 h-5 w-5 text-zinc-400 transition-colors group-has-[:checked]:text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 group-has-[:checked]:text-white">
                  {config.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Urgency
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {workOrderPriorities.map((priority) => {
            const config = priorityConfig[priority];
            return (
              <label
                key={priority}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-all hover:opacity-90 active:scale-[0.95]",
                  config.bg,
                  config.border
                )}
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority}
                  defaultChecked={priority === "medium"}
                  className="sr-only"
                />
                <span
                  className={cn("text-[10px] font-black uppercase tracking-widest", config.color.includes('text-white') ? 'text-white' : config.color)}
                >
                  {priority}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400"
          >
            Short Description
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g., Leaking oil, Strange noise..."
            required
            maxLength={200}
            className="h-10 text-sm px-3 rounded-lg border-zinc-200 bg-zinc-50/50 focus-visible:ring-zinc-900"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400"
          >
            Full Details
          </Label>
          <textarea
            id="description"
            name="description"
            placeholder="Describe the issue. What happened? Any error codes?"
            required
            rows={3}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
          />
        </div>
      </div>

      {/* Attachments Section */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Visual Evidence (Optional)
        </Label>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            disabled={isUploadingPhoto}
            className="h-10 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-600 text-[11px] font-bold"
          >
            {isUploadingPhoto ? (
              <div className="flex items-center gap- gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                Working...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera
              </div>
            )}
          </Button>
          <FileUpload
            entityType="work_order"
            entityId={equipment.id}
            onUploadComplete={handleUploadComplete}
            label="Upload"
          />
        </div>
      </div>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-10 text-[11px] font-black uppercase tracking-widest rounded-lg border-zinc-200 hover:bg-zinc-50 transition-all active:scale-95"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-[2] h-10 text-[11px] font-black uppercase tracking-widest rounded-lg bg-danger-600 hover:bg-danger-700 text-white shadow-sm transition-all active:scale-95"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Submit Report
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
