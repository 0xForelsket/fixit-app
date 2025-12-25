"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Printer, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";

interface Machine {
  id: number;
  name: string;
  code: string;
  location: { name: string } | null;
  owner: { name: string; employeeId: string } | null;
}

interface QRCodeGeneratorClientProps {
  machines: Machine[];
  baseUrl: string;
}

export function QRCodeGeneratorClient({ machines, baseUrl }: QRCodeGeneratorClientProps) {
  const [selectedMachines, setSelectedMachines] = useState<Set<number>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const toggleMachine = (id: number) => {
    setSelectedMachines((prev) => {
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
    setSelectedMachines(new Set(machines.map((m) => m.id)));
  };

  const selectNone = () => {
    setSelectedMachines(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  const machinesToPrint = selectedMachines.size > 0
    ? machines.filter((m) => selectedMachines.has(m.id))
    : machines;

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="text-muted-foreground">
            Generate printable QR codes for machine issue reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print {selectedMachines.size > 0 ? `(${selectedMachines.size})` : "All"}
          </Button>
        </div>
      </div>

      {/* Selection Controls - Hidden when printing */}
      <div className="flex items-center gap-4 print:hidden">
        <span className="text-sm text-muted-foreground">
          {selectedMachines.size} of {machines.length} selected
        </span>
        <Button variant="ghost" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={selectNone}>
          Clear
        </Button>
      </div>

      {/* Machine Selection Grid - Hidden when printing */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
        {machines.map((machine) => (
          <label
            key={machine.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
              selectedMachines.has(machine.id)
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500"
                : "bg-white hover:border-primary-300"
            )}
          >
            <input
              type="checkbox"
              checked={selectedMachines.has(machine.id)}
              onChange={() => toggleMachine(machine.id)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{machine.name}</p>
              <p className="text-xs text-muted-foreground">{machine.code}</p>
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
          {machinesToPrint.map((machine) => (
            <QRCard key={machine.id} machine={machine} baseUrl={baseUrl} />
          ))}
        </div>
      </div>

      {/* Preview Cards - Visible in browser */}
      <div className="print:hidden">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {machinesToPrint.slice(0, 6).map((machine) => (
            <QRCard key={machine.id} machine={machine} baseUrl={baseUrl} />
          ))}
          {machinesToPrint.length > 6 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                +{machinesToPrint.length - 6} more machines
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

function QRCard({ machine, baseUrl }: { machine: Machine; baseUrl: string }) {
  const reportUrl = `${baseUrl}/report/${machine.code}`;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm print:shadow-none print:border-2 print:break-inside-avoid">
      <div className="flex gap-4">
        {/* QR Code */}
        <div className="shrink-0">
          <div className="rounded-lg border-2 border-slate-200 p-2 bg-white">
            <QRCodeSVG
              value={reportUrl}
              size={120}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Machine Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-bold text-lg leading-tight">{machine.name}</h3>
            <p className="text-sm font-mono text-primary-600 font-semibold">
              {machine.code}
            </p>
          </div>

          {machine.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {machine.location.name}
            </div>
          )}

          {machine.owner && (
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              <span className="font-medium">5S Owner:</span> {machine.owner.name}
              <br />
              <span className="font-mono text-xs">{machine.owner.employeeId}</span>
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
