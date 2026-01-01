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
  /** Required for delete operations */
  id?: string;
}

interface AttachmentCardProps {
  file: AttachmentFile;
  className?: string;
  showDownload?: boolean;
  onDelete?: (attachmentId: string) => Promise<void>;
}

export function AttachmentCard({
  file,
  className,
  showDownload = true,
  onDelete,
}: AttachmentCardProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [_isInView, setIsInView] = useState(false);
  const [_isLoaded, _setIsLoaded] = useState(false);

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  // Performance Optimization: Lazy load the PDF iframe only when it's in the viewport
  const containerRef = (node: HTMLDivElement | null) => {
    if (!node || !isPdf) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: "200px" } // Start loading 200px before it enters view
    );
    observer.observe(node);
    return () => observer.disconnect();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onDelete || isDeleting || file.id === undefined) return;

    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }
    if (
      !window.confirm(
        "This action cannot be undone. Do you really want to proceed?"
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
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
        ref={containerRef}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-muted/20 transition-all hover:border-primary/50 hover:shadow-md",
          className
        )}
      >
        {onDelete && file.id !== undefined && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete ${file.filename}`}
            className={cn(
              "absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 hover:bg-red-700",
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
            aria-label={`Preview ${file.filename}`}
            className="group/pdf relative aspect-video w-full overflow-hidden bg-zinc-900 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            {/* Technical Blueprint Pattern */}
            <div
              className="absolute inset-0 z-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />

            <div
              className="absolute inset-0 z-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />

            {/* Document Content Signature (Pseudo-Code/Bars) */}
            <div className="relative z-10 w-[80px] aspect-[1/1.4] bg-zinc-800 border-l-4 border-primary-500 shadow-2xl origin-center scale-[0.7] group-hover/pdf:scale-[0.75] transition-transform duration-500 flex flex-col p-2 gap-1.5 overflow-hidden">
              {/* Header Block */}
              <div className="h-2 w-full bg-zinc-700/50 rounded-sm mb-1" />

              {/* Simulated Content Bars */}
              <div className="space-y-1">
                <div className="h-1 w-full bg-zinc-700/30 rounded-full" />
                <div className="h-1 w-5/6 bg-zinc-700/30 rounded-full" />
                <div className="h-1 w-full bg-zinc-700/30 rounded-full" />
              </div>

              {/* Technical Drawing Element */}
              <div className="mt-2 flex-1 border border-dashed border-zinc-700/50 rounded flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-zinc-700 items-center justify-center flex">
                  <div className="w-px h-full bg-zinc-700 absolute rotate-45" />
                  <div className="w-px h-full bg-zinc-700 absolute -rotate-45" />
                </div>
              </div>

              {/* Footer Metadata */}
              <div className="mt-auto flex justify-between items-end">
                <div className="h-1.5 w-6 bg-primary-500/40 rounded-sm" />
                <div className="text-[5px] font-mono text-zinc-500 uppercase leading-none">
                  v1.0
                </div>
              </div>
            </div>

            {/* Blueprint "Stamp" */}
            <div className="absolute top-2 right-2 z-20 px-1 py-0.5 border border-primary-500/50 rounded text-[7px] font-mono text-primary-400 uppercase tracking-tighter bg-primary-500/5 backdrop-blur-sm">
              Doc-Ref: {file.filename.slice(0, 4).toUpperCase()}
            </div>

            {/* Industrial Overlay Icon */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/pdf:opacity-100 transition-opacity bg-zinc-900/60 backdrop-blur-[2px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xl ring-2 ring-white/10 scale-90 group-hover/pdf:scale-100 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            {/* Document Indicator */}
            <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-zinc-800/90 border border-zinc-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-zinc-400">
              <FileText className="h-3 w-3 text-primary-500" />
              PDF
            </div>
          </button>
        ) : (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${file.filename}`}
            className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
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
              className="text-muted-foreground hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
