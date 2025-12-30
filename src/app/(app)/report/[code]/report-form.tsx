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
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    description: string;
  }
> = {
  low: {
    label: "Low",
    color: "text-primary-700",
    bg: "bg-primary-50",
    border: "border-primary-200",
    description: "Cosmetic or non-urgent issue",
  },
  medium: {
    label: "Medium",
    color: "text-primary-900",
    bg: "bg-white",
    border: "border-primary-300",
    description: "Needs attention within shift",
  },
  high: {
    label: "High",
    color: "text-warning-800",
    bg: "bg-warning-50",
    border: "border-warning-300",
    description: "Machine degraded, urgent fix",
  },
  critical: {
    label: "Critical",
    color: "text-white",
    bg: "bg-danger-600",
    border: "border-danger-700",
    description: "MACHINE STOPPED / Safety risk",
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
      const data = state.data as { id: number } | undefined;
      if (data?.id) {
        // Redirect to confirmation screen (Issue #1.4)
        router.push(`/my-tickets/${data.id}?success=true`);
      }
    }
  }, [state, router]);

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
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="equipmentId" value={equipment.id} />
      <input
        type="hidden"
        name="attachments"
        value={JSON.stringify(attachments)}
      />

      {/* Error display */}
      {state && !state.success && state.error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700 font-medium flex items-center gap-3">
          <ShieldAlert className="h-5 w-5" />
          {state.error}
        </div>
      )}

      {/* Ticket Type */}
      <div className="space-y-4">
        <Label className="text-sm font-black uppercase tracking-widest text-zinc-500">
          What type of issue is it?
        </Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {workOrderTypes.map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            return (
              <label
                key={type}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 bg-white p-4 text-center transition-all hover:border-primary-300 hover:bg-primary-50/50 has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50 has-[:checked]:shadow-sm active:scale-[0.98]"
              >
                <input
                  type="radio"
                  name="type"
                  value={type}
                  className="sr-only"
                  required
                />
                <Icon className="mb-3 h-8 w-8 text-zinc-400 transition-colors group-has-[:checked]:text-primary-600" />
                <span className="font-bold text-foreground group-has-[:checked]:text-primary-700">
                  {config.label}
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  {config.description}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-4">
        <Label className="text-sm font-black uppercase tracking-widest text-zinc-500">
          How urgent is this?
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {workOrderPriorities.map((priority) => {
            const config = priorityConfig[priority];
            return (
              <label
                key={priority}
                className={cn(
                  "relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:opacity-95 has-[:checked]:ring-2 has-[:checked]:ring-offset-2 has-[:checked]:ring-offset-background",
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
                <div className="flex-1">
                  <span
                    className={cn(
                      "font-bold text-lg capitalize block",
                      config.color
                    )}
                  >
                    {priority}
                  </span>
                  <span
                    className={cn(
                      "text-xs block mt-0.5",
                      priority === "critical"
                        ? "text-danger-100"
                        : "text-zinc-500"
                    )}
                  >
                    {config.description}
                  </span>
                </div>
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 border-zinc-300 flex items-center justify-center p-0.5 group-has-[:checked]:border-primary-600",
                    priority === "critical" && "border-danger-300"
                  )}
                >
                  <div className="h-full w-full rounded-full bg-primary-600 opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3">
        <Label
          htmlFor="title"
          className="text-sm font-black uppercase tracking-widest text-zinc-500"
        >
          Short description
        </Label>
        <Input
          id="title"
          name="title"
          placeholder={"e.g., Leaking oil, Strange noise..."}
          required
          maxLength={200}
          className="h-14 text-lg px-4 rounded-xl border-2 bg-zinc-50 focus-visible:ring-primary-500"
        />
      </div>

      {/* Description */}
      <div className="space-y-3">
        <Label
          htmlFor="description"
          className="text-sm font-black uppercase tracking-widest text-zinc-500"
        >
          Additional Details
        </Label>
        <textarea
          id="description"
          name="description"
          placeholder="Describe the issue in detail. What happened? Any error codes?"
          required
          rows={5}
          className="w-full rounded-xl border-2 bg-zinc-50 px-4 py-3 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 resize-none"
        />
      </div>

      {/* Attachments Section */}
      <div className="space-y-4">
        <Label className="text-sm font-black uppercase tracking-widest text-zinc-500">
          Attach Photos
        </Label>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            disabled={isUploadingPhoto}
            className="flex-1 h-14 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-100 hover:border-primary-400 text-primary-700 font-semibold"
          >
            {isUploadingPhoto ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
                Uploading...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Take Photo
              </div>
            )}
          </Button>
        </div>

        {/* Photo Previews */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden border bg-zinc-100 group"
              >
                <img
                  src={`/api/attachments/preview?key=${file.s3Key}`}
                  alt={file.filename}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <FileUpload
          entityType="work_order"
          entityId={equipment.id}
          onUploadComplete={handleUploadComplete}
          label="Or upload from device"
        />
      </div>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-14 text-base font-bold rounded-xl border-2 border-zinc-200"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-[2] h-14 text-base font-black uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Submit Report
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
