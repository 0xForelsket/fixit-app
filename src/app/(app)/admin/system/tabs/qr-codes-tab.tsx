"use client";

import { Button } from "@/components/ui/button";
import { QRCode } from "@/components/ui/qr-code";
import { cn } from "@/lib/utils";
import { MapPin, Printer, QrCode } from "lucide-react";
import { useRef, useState } from "react";

interface Equipment {
  id: string;
  name: string;
  code: string;
  location: { name: string } | null;
  owner: { name: string; employeeId: string } | null;
}

interface QrCodesTabProps {
  equipment: Equipment[];
  baseUrl: string;
}

export function QrCodesTab({ equipment, baseUrl }: QrCodesTabProps) {
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
    setSelectedEquipment(new Set(equipment.map((e) => e.id)));
  };

  const selectNone = () => {
    setSelectedEquipment(new Set());
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const selectedItems = equipment.filter((e) => selectedEquipment.has(e.id));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Labels</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; break-inside: avoid; }
            .qr-code { margin: 0 auto 12px; }
            .name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
            .code { font-family: monospace; font-size: 11px; color: #6b7280; margin-bottom: 8px; }
            .location { font-size: 11px; color: #9ca3af; display: flex; align-items: center; justify-content: center; gap: 4px; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${selectedItems
              .map(
                (item) => `
              <div class="card">
                <div class="qr-code">
                  ${document.getElementById(`qr-${item.id}`)?.innerHTML || ""}
                </div>
                <div class="name">${item.name}</div>
                <div class="code">${item.code}</div>
                <div class="location">
                  ${item.location?.name || "No location"}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="rounded-full"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectNone}
            className="rounded-full"
          >
            Clear
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedEquipment.size} of {equipment.length} selected
          </span>
        </div>
        <Button
          onClick={handlePrint}
          disabled={selectedEquipment.size === 0}
          className="rounded-full font-black text-[10px] uppercase tracking-wider"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Labels
        </Button>
      </div>

      {/* Equipment Grid */}
      {equipment.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No equipment found</p>
          <p className="text-sm">Add equipment to generate QR codes</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipment.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleEquipment(item.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:shadow-md cursor-pointer",
                selectedEquipment.has(item.id)
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  id={`qr-${item.id}`}
                  className="shrink-0 rounded-lg bg-white p-2 shadow-sm"
                >
                  <QRCode
                    value={`${baseUrl}/equipment/${item.code}`}
                    size={64}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.code}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {item.location?.name || "No location"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hidden print container */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
