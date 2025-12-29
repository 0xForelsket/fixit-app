"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";

export function PrintButton() {
  const [ticketUrl, setTicketUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTicketUrl(window.location.href.split("?")[0]);
    }
  }, []);

  const handlePrint = () => {
    // Dynamically add print styles for line-clamp
    const style = document.createElement('style');
    style.innerHTML = `
      /* Show full text in line-clamp elements */
      @media print {
        .line-clamp-1, .line-clamp-2, .line-clamp-3, .line-clamp-4 {
          display: block !important;
          -webkit-line-clamp: none !important;
          line-clamp: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    // Remove the style after printing to avoid side effects
    document.head.removeChild(style);
  };

  return (
    <div className="flex gap-2 no-print">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="font-bold border-2"
      >
        <Printer className="mr-2 h-4 w-4" />
        PRINT / PDF
      </Button>

      {/* Hidden QR Code for print view */}
      <div className="hidden print:block fixed top-0 right-0 p-4 text-center">
        {ticketUrl && (
          <div className="flex flex-col items-center gap-1">
            <QRCodeSVG value={ticketUrl} size={80} marginSize={2} />
            <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">
              Verify Digital Copy
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
