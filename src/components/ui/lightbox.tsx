"use client";

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
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle escape key and backdrop click
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      // Close when clicking on the backdrop (outside the image container)
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 flex h-screen w-screen max-h-none max-w-none items-center justify-center bg-black/90 backdrop:bg-transparent"
      aria-label={`Image: ${alt}`}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image container */}
      <div className="relative max-h-[90vh] max-w-[90vw]">
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </div>
    </dialog>
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
        className={cn("cursor-zoom-in", containerClassName)}
        aria-label={`View ${alt} in full size`}
      >
        {/* biome-ignore lint/a11y/useAltText: alt is passed dynamically */}
        <img src={src} alt={alt} className={className} {...props} />
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
