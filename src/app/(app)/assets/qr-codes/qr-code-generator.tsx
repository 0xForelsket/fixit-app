"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Printer, QrCode } from "lucide-react";
import { QRCode } from "@/components/ui/qr-code";
import { useRef, useState } from "react";

interface Equipment {
  id: string;
  name: string;
  code: string;
  location: { name: string } | null;
  owner: { name: string; employeeId: string } | null;
}

interface QRCodeGeneratorClientProps {
  equipment: Equipment[];
  baseUrl: string;
}

export function QRCodeGeneratorClient({
  equipment,
  baseUrl,
}: QRCodeGeneratorClientProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    new Set()
  );
  const printRef = useRef<HTMLDivElement>(null);

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedEquipment(new Set(equipment.map((m) => m.id)));
  };

  const selectNone = () => {
    setSelectedEquipment(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  const equipmentToPrint =
    selectedEquipment.size > 0
      ? equipment.filter((m) => selectedEquipment.has(m.id))
      : equipment;

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-8 print:hidden">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Asset <span className="text-primary-600">Tags</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <QrCode className="h-3.5 w-3.5" />
            GENERATE PRINTABLES FOR ISSUE REPORTING
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="font-bold border-2"
          >
            <Printer className="mr-2 h-4 w-4" />
            PRINT LABELS{" "}
            {selectedEquipment.size > 0 ? `(${selectedEquipment.size})` : "ALL"}
          </Button>
        </div>
      </div>

      {/* Selection Controls - Hidden when printing */}
      <div className="flex items-center gap-4 print:hidden">
        <span className="text-sm text-muted-foreground">
          {selectedEquipment.size} of {equipment.length} selected
        </span>
        <Button variant="ghost" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={selectNone}>
          Clear
        </Button>
      </div>

      {/* Equipment Selection Grid - Hidden when printing */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
        {equipment.map((equipment) => (
          <label
            key={equipment.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
              selectedEquipment.has(equipment.id)
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500"
                : "bg-white hover:border-primary-300"
            )}
          >
            <input
              type="checkbox"
              checked={selectedEquipment.has(equipment.id)}
              onChange={() => toggleEquipment(equipment.id)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{equipment.name}</p>
              <p className="text-xs text-muted-foreground">{equipment.code}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Printable QR Cards */}
      <div
        ref={printRef}
        className="print:block hidden print:!block"
        style={{ display: "none" }}
      >
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area,
            .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          }
        `}</style>
        <div className="print-area grid grid-cols-2 gap-4">
          {equipmentToPrint.map((equipment) => (
            <QRCard
              key={equipment.id}
              equipment={equipment}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      </div>

      {/* Preview Cards - Visible in browser */}
      <div className="print:hidden">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {equipmentToPrint.slice(0, 6).map((equipment) => (
            <QRCard
              key={equipment.id}
              equipment={equipment}
              baseUrl={baseUrl}
            />
          ))}
          {equipmentToPrint.length > 6 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                +{equipmentToPrint.length - 6} more equipment
                <br />
                <span className="text-sm">Click Print to see all</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QRCard({
  equipment,
  baseUrl,
}: { equipment: Equipment; baseUrl: string }) {
  const reportUrl = `${baseUrl}/equipment/${equipment.code}`;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm print:shadow-none print:border-2 print:break-inside-avoid">
      <div className="flex gap-4">
        {/* QR Code */}
        <div className="shrink-0">
          <div className="rounded-lg border-2 border-slate-200 p-2 bg-white">
            <QRCode
              value={reportUrl}
              size={120}
            />
          </div>
        </div>

        {/* Equipment Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {equipment.name}
            </h3>
            <p className="text-sm font-mono text-primary-600 font-semibold">
              {equipment.code}
            </p>
          </div>

          {equipment.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {equipment.location.name}
            </div>
          )}

          {equipment.owner && (
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              <span className="font-medium">Owner:</span> {equipment.owner.name}
              <br />
              <span className="font-mono text-xs">
                {equipment.owner.employeeId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scan instruction */}
      <div className="mt-4 pt-3 border-t text-center">
        <p className="text-xs text-muted-foreground">
          <QrCode className="inline h-3 w-3 mr-1" />
          Scan to report an issue
        </p>
      </div>
    </div>
  );
}
