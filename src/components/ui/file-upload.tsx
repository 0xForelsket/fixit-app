"use client";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { FileIcon, ImageIcon, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface FileUploadProps {
  onUploadComplete: (attachment: {
    s3Key: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }) => void;
  entityType: "user" | "equipment" | "work_order" | "location";
  entityId: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  variant?: "default" | "compact";
  hidePreviews?: boolean;
  attachmentType?: "photo" | "document" | "avatar";
}

export function FileUpload({
  onUploadComplete,
  entityType,
  entityId,
  label,
  accept = "image/*,application/pdf",
  maxSizeMB = 10,
  variant = "default",
  hidePreviews = false,
  attachmentType,
}: FileUploadProps) {
  const { uploadFiles, isUploading, error: uploadError } = useFileUpload();
  const [previews, setPreviews] = useState<
    { id: string; url: string; name: string; type: string }[]
  >([]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const handleUploadSuccess = (attachment: {
        s3Key: string;
        filename: string;
        mimeType: string;
        sizeBytes: number;
      }) => {
        onUploadComplete(attachment);

        const file = files.find((f) => f.name === attachment.filename);
        if (file) {
          const url = attachment.mimeType.startsWith("image/")
            ? URL.createObjectURL(file)
            : "";
          setPreviews((prev) => [
            ...prev,
            {
              id: attachment.s3Key,
              url,
              name: attachment.filename,
              type: attachment.mimeType,
            },
          ]);
        }
      };

      await uploadFiles(files, {
        entityType,
        entityId,
        maxSizeMB,
        attachmentType,
        onUploadComplete: handleUploadSuccess,
      });

      e.target.value = "";
    },
    [
      entityType,
      entityId,
      maxSizeMB,
      onUploadComplete,
      uploadFiles,
      attachmentType,
    ]
  );

  const removePreview = (id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="relative flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-[11px] font-bold text-muted-foreground transition-all hover:bg-muted active:scale-95">
          <input
            type="file"
            multiple
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : label || "Upload File"}
        </label>
        {uploadError && (
          <p className="text-[10px] font-bold text-danger">{uploadError}</p>
        )}
        {!hidePreviews && (
          <PreviewList previews={previews} onRemove={removePreview} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-2 cursor-pointer">
        {label && (
          <span className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
            {label}
          </span>
        )}

        <div className="relative">
          <input
            type="file"
            multiple
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            disabled={isUploading}
          />
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all",
              isUploading
                ? "bg-muted animate-pulse"
                : "hover:bg-primary/5 hover:border-primary/30 bg-card border-border"
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or PDF up to {maxSizeMB}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </label>

      {uploadError && (
        <p className="text-sm font-medium text-destructive">{uploadError}</p>
      )}

      {!hidePreviews && (
        <PreviewList previews={previews} onRemove={removePreview} />
      )}
    </div>
  );
}

function PreviewList({
  previews,
  onRemove,
}: {
  previews: { id: string; url: string; name: string; type: string }[];
  onRemove: (id: string) => void;
}) {
  if (previews.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {previews.map((file) => (
        <div
          key={file.id}
          className="group relative h-32 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
        >
          {file.type.startsWith("image/") ? (
            <Image
              src={file.url}
              alt={file.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-32 flex-col items-center justify-center bg-muted/50">
              <FileIcon className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 px-2 text-center text-[10px] font-medium text-muted-foreground truncate w-full">
                {file.name}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-danger opacity-0 shadow-sm transition-all hover:bg-background group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
