"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

interface LightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ src, alt, isOpen, onClose }: LightboxProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-auto h-auto max-h-[95vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden flex items-center justify-center">
        <DialogTitle className="sr-only">View Image</DialogTitle>
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Close button - custom positioned */}
          <DialogClose
            className="absolute -top-12 right-0 z-50 rounded-full bg-black/50 p-2 text-white opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LightboxImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
  containerClassName?: string;
}

export function LightboxImage({
  src,
  alt,
  className,
  containerClassName,
  ...props
}: LightboxImageProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
          containerClassName
        )}
        aria-label={`View ${alt} in full size`}
      >
        <img src={src} className={className} {...props} alt={alt} />
      </button>
      <Lightbox
        src={src}
        alt={alt}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
