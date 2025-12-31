"use client";

import { LightboxImage } from "@/components/ui/lightbox";
import { Download, FileText } from "lucide-react";

interface Attachment {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

interface WorkOrderAttachmentsProps {
  attachments: Attachment[];
}

export function WorkOrderAttachments({
  attachments,
}: WorkOrderAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Attachments</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border bg-slate-50 transition-all hover:border-primary-300 hover:shadow-md"
          >
            {file.mimeType.startsWith("image/") ? (
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <LightboxImage
                  src={file.url}
                  alt={file.filename}
                  containerClassName="block h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-video w-full items-center justify-center bg-slate-100 text-slate-400"
              >
                <FileText className="h-10 w-10" />
              </a>
            )}
            <div className="flex items-center justify-between p-3">
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs font-medium text-foreground">
                  {file.filename}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {(file.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary-600"
                aria-label={`Download ${file.filename}`}
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
