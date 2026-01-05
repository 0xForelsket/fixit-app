"use client";

import { Button } from "@/components/ui/button";
// html5-qrcode is dynamically imported to reduce bundle size
import type { Html5QrcodeScanner } from "html5-qrcode";
import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    setError(null);

    let isCancelled = false;
    let scannerInstance: Html5QrcodeScanner | null = null;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        if (isCancelled) return;

        const scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true,
            supportedScanTypes: [],
          },
          false
        );

        scannerRef.current = scanner;
        scannerInstance = scanner;

        scanner.render(
          (decodedText: string) => {
            onScan(decodedText);
          },
          (_errorMessage: string) => {}
        );
      } catch (err) {
        console.error("Failed to initialize QR scanner", err);
        setError("Failed to initialize camera. Please check permissions.");
      }
    };

    initScanner();

    return () => {
      isCancelled = true;
      if (scannerInstance) {
        scannerInstance.clear().catch((err: unknown) => {
          console.error("Failed to clear scanner", err);
        });
        scannerRef.current = null;
      }
    };
  }, [isOpen, mounted, onScan]);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm animate-in fade-in duration-200">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 z-50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-12 w-12"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Close</span>
      </Button>

      <div className="w-full max-w-md p-4 relative flex flex-col items-center">
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-mono border-b-2 border-primary-500 inline-block pb-1">
            Scan Equipment
          </h2>
          <p className="text-zinc-400 text-sm">
            Align QR code within the frame
          </p>
        </div>

        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
          <div id="reader" className="w-full h-full" />

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-center p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Camera Error</h3>
                <p className="text-zinc-400 text-sm mt-1">{error}</p>
              </div>
              <Button onClick={onClose} variant="secondary">
                Close Scanner
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 w-full text-xs font-mono text-zinc-500 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>SYSTEM ACTIVE</span>
          </div>
          <div className="text-right">ID: SCAN-MODULE-V1</div>
        </div>
      </div>

      <style jsx global>{`
        #reader {
          border: none !important;
          background: #000 !important;
        }
        
        #reader__dashboard_section_csr span {
          display: none !important;
        }
        
        #reader__dashboard_section_swaplink {
            display: none !important;
        }
        
        #reader__dashboard_section_csr button {
          background-color: var(--color-primary-600);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-weight: 600;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 20px;
        }
        
        #reader__dashboard_section_csr button:hover {
          background-color: var(--color-primary-500);
        }

        #reader__status_span {
           display: none !important;
        }
           
        #reader__dashboard_section_csr select {
            background: #18181b;
            color: #fff;
            border: 1px solid #3f3f46;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
            max-width: 100%;
        }
        
        video {
            object-fit: cover;
            border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
