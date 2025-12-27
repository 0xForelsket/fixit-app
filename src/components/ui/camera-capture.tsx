"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, Camera, Check, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, filename: string) => void;
}

export function CameraCapture({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionDenied(true);
        setError(
          "Camera access denied. Please allow camera access to use this feature."
        );
      } else {
        setError("Could not access camera. Please check your device settings.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const filename = `capture-${new Date().getTime()}.jpg`;
          onCapture(blob, filename);
          handleClose();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn(
          "bg-black p-0 border-slate-800 text-slate-100",
          "h-[100dvh] w-screen max-w-none rounded-none border-0",
          "top-0 left-0 translate-x-0 translate-y-0",
          "sm:h-auto sm:w-full sm:max-w-xl sm:rounded-xl sm:border sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]"
        )}
      >
        <div className="relative flex flex-col h-full sm:h-auto">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 sm:rounded-t-xl">
            <div className="flex items-center justify-between text-white">
              <DialogTitle className="flex items-center gap-2 text-base font-medium tracking-wide">
                <Camera className="h-5 w-5 text-primary-500" />
                CAPTURE ISSUE
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden sm:min-h-[500px]">
            {error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Camera Error
                </h3>
                <p className="mt-2 text-sm text-slate-400 max-w-xs">{error}</p>
                {permissionDenied && (
                  <Button
                    variant="outline"
                    className="mt-6 border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                )}
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 border border-white/30 rounded-lg">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary-500 rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary-500 rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary-500 rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary-500 rounded-br-sm" />
                  </div>
                  <div className="absolute inset-0 bg-black/10 industrial-grid opacity-20" />
                </div>

                <div
                  className={cn(
                    "absolute inset-0 bg-white pointer-events-none transition-opacity duration-150",
                    isFlashing ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="bg-black p-6 sm:rounded-b-xl border-t border-slate-800">
            {capturedImage ? (
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="flex-1 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white h-12"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white h-12 font-semibold tracking-wide"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Use Photo
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {!error && (
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 transition-all active:scale-95"
                    aria-label="Take Photo"
                  >
                    <span className="absolute h-16 w-16 rounded-full border-4 border-white transition-all group-hover:border-primary-400 group-active:scale-90" />
                    <span className="h-14 w-14 rounded-full bg-white transition-all group-active:bg-primary-500" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
