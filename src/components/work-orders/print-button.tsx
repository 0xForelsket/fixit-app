"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
// qrcode is dynamically imported in handlePrint to reduce bundle size
import { useState } from "react";

interface PrintButtonProps {
  // biome-ignore lint/suspicious/noExplicitAny: Legacy component
  workOrder?: any;
}

export function PrintButton({ workOrder }: PrintButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    // If no workOrder data is passed (legacy mode), fallback to window.print()
    if (!workOrder) {
      window.print();
      return;
    }

    try {
      setIsGenerating(true);

      // Dynamically import heavy PDF libraries and qrcode only when needed
      const [{ pdf }, { WorkOrderPDF }, QRCode] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf-document"),
        import("qrcode"),
      ]);

      // Generate QR Code URL
      const ticketUrl = window.location.href;
      const qrCodeUrl = await QRCode.toDataURL(ticketUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Generate PDF
      const blob = await pdf(
        <WorkOrderPDF workOrder={workOrder} qrCodeUrl={qrCodeUrl} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("PDF Generation failed:", error);
      // Fallback
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={isGenerating}
      className="font-bold border-2"
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? "GENERATING..." : "DOWNLOAD PDF"}
    </Button>
  );
}
