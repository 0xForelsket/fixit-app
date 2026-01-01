"use client";

import { updateUserAvatar } from "@/actions/users";
import { FileUpload } from "@/components/ui/file-upload";
import { useRouter } from "next/navigation";

interface UploadedFile {
  s3Key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export function AvatarUpload({ userId }: { userId: string }) {
  const router = useRouter();

  const handleUpload = async (file: UploadedFile) => {
    await updateUserAvatar(file);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <FileUpload
        entityType="user"
        entityId={userId}
        onUploadComplete={handleUpload}
        label="Select a new photo"
        accept="image/*"
        maxSizeMB={5}
        attachmentType="avatar"
      />
    </div>
  );
}
