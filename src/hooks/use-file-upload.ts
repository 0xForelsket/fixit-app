import { useCallback, useState } from "react";

interface UploadOptions {
  entityType: "user" | "equipment" | "work_order" | "location";
  entityId: string;
  maxSizeMB?: number;
  attachmentType?: "photo" | "document" | "avatar";
  onUploadComplete: (attachment: {
    s3Key: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }) => void;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: File[], options: UploadOptions) => {
      if (files.length === 0) return;

      setError(null);
      setIsUploading(true);
      const maxSizeMB = options.maxSizeMB || 10;

      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File ${file.name} is too large (max ${maxSizeMB}MB)`);
          continue;
        }

        try {
          // 1. Create attachment record & Get presigned URL
          const response = await fetch("/api/attachments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              entityType: options.entityType,
              entityId: options.entityId,
              attachmentType:
                options.attachmentType ||
                (file.type.startsWith("image/") ? "photo" : "document"),
            }),
          });

          if (!response.ok) throw new Error("Failed to get upload URL");

          const json = await response.json();
          console.log("Upload response:", json);
          const { data } = json;

          if (!data || !data.attachment) {
            throw new Error("Invalid server response: missing attachment data");
          }

          const { attachment, uploadUrl } = data;

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
          options.onUploadComplete({
            s3Key: attachment.s3Key,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          });
        } catch (err) {
          console.error("Upload error:", err);
          setError("Failed to upload some files. Please try again.");
        }
      }

      setIsUploading(false);
    },
    []
  );

  return {
    uploadFiles,
    isUploading,
    error,
  };
}
