"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 128, className }: QRCodeProps) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let isCancelled = false;

    const generateQR = async () => {
      try {
        const QRCodeLib = await import("qrcode");
        if (isCancelled) return;

        const svgString = await QRCodeLib.toString(value, {
          type: "svg",
          width: size,
          margin: 0,
          color: {
            dark: "#000000",
            light: "#ffffff00", // Transparent background
          },
        });

        if (!isCancelled) {
          setSvg(svgString);
        }
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    };

    generateQR();

    return () => {
      isCancelled = true;
    };
  }, [value, size]);

  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn("bg-zinc-100 animate-pulse rounded-lg", className)}
      />
    );
  }

  return (
    <div
      className={cn("bg-white p-1 rounded-lg inline-block", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: QR Code SVG generation
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
