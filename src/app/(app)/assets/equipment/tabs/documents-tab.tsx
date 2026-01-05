"use client";

import { AttachmentCard } from "@/components/ui/attachment-card";
import { FileUpload } from "@/components/ui/file-upload";
import { EmptyState } from "@/components/ui/empty-state";
import type { Attachment } from "@/db/schema";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

import { PERMISSIONS, hasPermission } from "@/lib/permissions";

interface AttachmentWithUrl extends Attachment {
  uploadedBy?: { name: string } | null;
  url?: string;
}

interface DocumentsTabProps {
  equipmentId?: string;
  attachments: AttachmentWithUrl[];
  isNew?: boolean;
  userPermissions?: string[];
}

export function DocumentsTab({
  equipmentId,
  attachments,
  isNew,
  userPermissions = [],
}: DocumentsTabProps) {
  const router = useRouter();

  const canDelete = hasPermission(
    userPermissions,
    PERMISSIONS.EQUIPMENT_ATTACHMENT_DELETE
  );

  if (isNew) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Documents can be uploaded after the equipment is created. Save the
            equipment first, then return to this tab to add documentation.
          </p>
        </div>
      </div>
    );
  }

  if (!equipmentId) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
        <p className="text-sm text-danger-700">
          Equipment ID is required to manage documents.
        </p>
      </div>
    );
  }

  const manuals = attachments.filter(
    (a) => a.mimeType === "application/pdf" || a.type === "document"
  );
  const images = attachments.filter(
    (a) => a.mimeType.startsWith("image/") && a.type !== "document"
  );

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Upload manuals, schematics, technical drawings, and photos for this
          equipment. Supported formats: PDF, JPEG, PNG, WebP (max 10MB).
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Upload Documents
        </h3>
        <FileUpload
          entityType="equipment"
          entityId={equipmentId}
          onUploadComplete={() => router.refresh()}
          accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
          attachmentType="document"
          label="Drop files here or click to upload"
          maxSizeMB={10}
        />
      </div>

      {/* Manuals & Documents */}
      {manuals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Manuals & Documents ({manuals.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {manuals.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                file={{
                  id: attachment.id,
                  filename: attachment.filename,
                  mimeType: attachment.mimeType,
                  sizeBytes: attachment.sizeBytes,
                  url: attachment.url || "",
                }}
                onDelete={
                  canDelete
                    ? async () => {
                        try {
                          await api.delete(`/api/attachments/${attachment.id}`);
                          router.refresh();
                        } catch (error) {
                          console.error("Failed to delete attachment:", error);
                        }
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Photos & Images ({images.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                file={{
                  id: attachment.id,
                  filename: attachment.filename,
                  mimeType: attachment.mimeType,
                  sizeBytes: attachment.sizeBytes,
                  url: attachment.url || "",
                }}
                onDelete={async () => {
                  try {
                    await api.delete(`/api/attachments/${attachment.id}`);
                    router.refresh();
                  } catch (error) {
                    console.error("Failed to delete attachment:", error);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload manuals, schematics, or photos to keep all equipment documentation in one place."
        />
      )}
    </div>
  );
}
