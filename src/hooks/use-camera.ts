import { useCallback, useEffect, useRef, useState } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
}

export function useCamera({
  width = 1920,
  height = 1080,
}: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setIsActive(false);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionDenied(true);
        setError(
          "Camera access denied. Please allow camera access to use this feature."
        );
      } else {
        setError("Could not access camera. Please check your device settings.");
      }
    }
  }, [width, height]);

  const stopCamera = useCallback(() => {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setStream(null);
      setIsActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const takePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    startCamera,
    stopCamera,
    takePhoto,
    error,
    permissionDenied,
    isActive,
  };
}
