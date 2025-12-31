"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintWorkOrderButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-2 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Print Work Order
    </Button>
  );
}
