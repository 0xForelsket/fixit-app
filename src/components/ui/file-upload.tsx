"use client";
import { cn } from "@/lib/utils";
import { FileIcon, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

interface FileUploadProps {
  onUploadComplete: (attachment: {
    s3Key: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }) => void;
  entityType: "user" | "machine" | "ticket" | "location";
  entityId: number;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onUploadComplete,
  entityType,
  entityId,
  label = "Attach Files (Images or PDF)",
  accept = "image/*,application/pdf",
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isUploading, setIsPending] = useState(false);
  const [previews, setPreviews] = useState<
    { id: string; url: string; name: string; type: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setError(null);
      setIsPending(true);

      for (const file of files) {
        // Validate size
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File ${file.name} is too large (max ${maxSizeMB}MB)`);
          continue;
        }

        try {
          // 1. Get presigned URL
          const response = await fetch("/api/attachments/presigned-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              entityType,
              entityId,
            }),
          });

          if (!response.ok) throw new Error("Failed to get upload URL");

          const { uploadUrl, s3Key } = await response.json();

          // 2. Upload to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok)
            throw new Error("Failed to upload to storage");

          // 3. Notify parent
          onUploadComplete({
            s3Key,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          });

          // 4. Add to previews
          const url = file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : "";
          setPreviews((prev) => [
            ...prev,
            { id: s3Key, url, name: file.name, type: file.type },
          ]);
        } catch (err) {
          console.error("Upload error:", err);
          setError("Failed to upload some files. Please try again.");
        }
      }

      setIsPending(false);
      // Reset input
      e.target.value = "";
    },
    [entityType, entityId, maxSizeMB, onUploadComplete]
  );

  const removePreview = (id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
    // Note: We don't delete from S3 here for simplicity in the prototype
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          {label}
        </label>

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
                : "hover:bg-primary-50/50 hover:border-primary-300 bg-white"
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-primary-100 p-3">
                  <ImageIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG or PDF up to {maxSizeMB}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {/* Previews Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {previews.map((file) => (
            <div
              key={file.id}
              className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 flex-col items-center justify-center bg-slate-50">
                  <FileIcon className="h-10 w-10 text-slate-400" />
                  <p className="mt-2 px-2 text-center text-[10px] font-medium text-slate-600 truncate w-full">
                    {file.name}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => removePreview(file.id)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 opacity-0 shadow-sm transition-all hover:bg-white group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
