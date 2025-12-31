"use client";

import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/ui/camera-capture";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { AttachmentCard } from "@/components/ui/attachment-card";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { Camera, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Attachment {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

interface WorkOrderAttachmentsProps {
  attachments: Attachment[];
  workOrderId: number;
  className?: string;
}

export function WorkOrderAttachments({
  attachments,
  workOrderId,
  className,
}: WorkOrderAttachmentsProps) {
  const router = useRouter();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { uploadFiles, isUploading } = useFileUpload();

  const handleUploadComplete = () => {
    router.refresh();
    setIsUploadOpen(false);
  };

  const handleCameraCapture = async (blob: Blob, filename: string) => {
    const file = new File([blob], filename, { type: blob.type });
    await uploadFiles([file], {
      entityType: "work_order",
      entityId: workOrderId,
      attachmentType: "photo",
      onUploadComplete: handleUploadComplete,
    });
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Attachments
            </h2>
            <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-bold">
            {attachments.length}
            </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs font-bold"
          onClick={() => setIsUploadOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <div className="p-4">
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <Upload className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">No attachments</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload photos or documents
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {attachments.map((file) => (
              <AttachmentCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50"
                onClick={() => setIsCameraOpen(true)}
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="font-bold text-xs">Take Photo</span>
              </Button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-bold">Or upload file</span>
                </div>
            </div>

            <FileUpload
              entityType="work_order"
              entityId={workOrderId}
              onUploadComplete={handleUploadComplete}
              hidePreviews
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
