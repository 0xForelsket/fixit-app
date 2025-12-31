"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, FileText, SquareArrowOutUpRight, X } from "lucide-react";

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    filename: string;
    url: string;
    sizeBytes?: number;
  } | null;
}

export function PdfPreviewDialog({
  isOpen,
  onClose,
  file,
}: PdfPreviewDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col max-w-[95vw] w-full h-[92vh] p-0 gap-0 bg-zinc-950 border-zinc-800 overflow-hidden sm:rounded-xl [&>button]:hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-primary-700 bg-primary-800 shrink-0 select-none text-primary-foreground">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden text-white">
              <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-[400px] drop-shadow-sm">
                {file.filename}
              </span>
              <span className="text-[10px] font-medium text-primary-200/80 uppercase tracking-wider flex items-center gap-1.5">
                PDF Document{" "}
                <span className="w-0.5 h-0.5 bg-primary-200/50 rounded-full" />{" "}
                {file.sizeBytes
                  ? (file.sizeBytes / 1024 / 1024).toFixed(2)
                  : "0.00"}{" "}
                MB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 text-primary-100 hover:text-white hover:bg-white/10 gap-2 cursor-pointer border border-transparent hover:border-white/10"
            >
              <a href={file.url} download>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-100 hover:text-white hover:bg-white/10 cursor-pointer"
              onClick={() => window.open(file.url, "_blank")}
            >
              <span className="sr-only">Open in New Tab</span>
              <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-primary-700 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-100 hover:text-white hover:bg-red-500/20 hover:border-red-500/20 border border-transparent cursor-pointer"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-zinc-200/50 relative w-full h-full overflow-hidden flex flex-col">
          <iframe
            src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0 block"
            title={file.filename}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
