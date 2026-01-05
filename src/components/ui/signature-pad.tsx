"use client";

import { cn } from "@/lib/utils";
import { Eraser } from "lucide-react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onChange?: (dataUrl: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function SignaturePad({
  onChange,
  className,
  disabled = false,
}: SignaturePadProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleEnd = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setHasSignature(true);
      const dataUrl = sigCanvasRef.current.toDataURL("image/png");
      onChange?.(dataUrl);
    }
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    setHasSignature(false);
    onChange?.(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Signature
        </span>
        {hasSignature && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            <Eraser className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed bg-card transition-colors overflow-hidden",
          disabled
            ? "border-border/50 bg-muted/50 cursor-not-allowed"
            : "border-border hover:border-muted-foreground/50",
          hasSignature && "border-solid border-primary/30"
        )}
      >
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          canvasProps={{
            className: cn("w-full h-24", disabled ? "pointer-events-none" : ""),
          }}
          onEnd={handleEnd}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground/50">Sign here</span>
          </div>
        )}
      </div>
    </div>
  );
}
