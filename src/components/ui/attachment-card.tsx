"use client";

import { LightboxImage } from "@/components/ui/lightbox";
import { PdfPreviewDialog } from "@/components/ui/pdf-preview-dialog";
import { cn } from "@/lib/utils";
import { Download, FileText, X } from "lucide-react";
import { useState } from "react";

export interface AttachmentFile {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  id?: number | string;
}

interface AttachmentCardProps {
  file: AttachmentFile;
  className?: string;
  showDownload?: boolean;
  onDelete?: (attachmentId: number) => Promise<void>;
}

export function AttachmentCard({
  file,
  className,
  showDownload = true,
  onDelete,
}: AttachmentCardProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDelete || isDeleting) return;

    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }
    if (!window.confirm("This action cannot be undone. Do you really want to proceed?")) {
      return;
    }

    setIsDeleting(true);
    try {
      // @ts-ignore - id is optional in interface but required for db operations
      await onDelete(file.id);
    } catch (error) {
        console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-muted/20 transition-all hover:border-primary/50 hover:shadow-md",
          className
        )}
      >
        {onDelete && (
           <button
             onClick={handleDelete}
             disabled={isDeleting}
             className={cn(
               "absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-red-700",
               isDeleting && "opacity-100 cursor-not-allowed bg-red-400"
             )}
             title="Delete Attachment"
           >
             <X className="h-3.5 w-3.5" strokeWidth={3} />
           </button>
        )}

        {isImage ? (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <LightboxImage
              src={file.url}
              alt={file.filename}
              containerClassName="block h-full w-full"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : isPdf ? (
          <button
            type="button"
            onClick={() => setShowPdfPreview(true)}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary"
          >
            <FileText className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Preview PDF
            </span>
          </button>
        ) : (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors"
          >
            <FileText className="h-10 w-10" />
          </a>
        )}

        <div className="flex items-center justify-between p-3 bg-card border-t border-border">
          <div className="flex-1 overflow-hidden">
            <p
              className="truncate text-xs font-bold text-foreground"
              title={file.filename}
            >
              {file.filename}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              {(file.sizeBytes / 1024).toFixed(0)} KB
            </p>
          </div>
          {showDownload && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Download ${file.filename}`}
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>


      <PdfPreviewDialog
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        file={file}
      />
    </>
  );
}

