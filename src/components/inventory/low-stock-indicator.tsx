"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Package, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface LowStockItem {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  locationName: string;
  quantity: number;
  reorderPoint: number;
}

interface LowStockIndicatorProps {
  items: LowStockItem[];
  compact?: boolean;
}

export function LowStockIndicator({
  items,
  compact = false,
}: LowStockIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  const outOfStockCount = items.filter((item) => item.quantity === 0).length;
  const isCritical = outOfStockCount > 0;

  if (compact) {
    return (
      <Link
        href="/assets/inventory?filter=low-stock"
        className={cn(
          "relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
          isCritical
            ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
            : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
        )}
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-bold">
          {items.length} Low Stock
          {outOfStockCount > 0 && (
            <span className="ml-1">({outOfStockCount} OOS)</span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center h-10 w-10 rounded-full transition-all",
          isCritical
            ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
            : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
        )}
      >
        <AlertTriangle className="h-5 w-5" />
        <span
          className={cn(
            "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-black text-white",
            isCritical ? "bg-red-500" : "bg-amber-500"
          )}
        >
          {items.length}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      isCritical ? "text-red-500" : "text-amber-500"
                    )}
                  />
                  Low Stock Alert
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length} item{items.length !== 1 ? "s" : ""} need
                  reordering
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {items.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/assets/inventory/parts/${item.partId}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center",
                      item.quantity === 0
                        ? "bg-red-500/10 text-red-600"
                        : "bg-amber-500/10 text-amber-600"
                    )}
                  >
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.partName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.locationName} • SKU: {item.partSku}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        item.quantity === 0 ? "text-red-600" : "text-amber-600"
                      )}
                    >
                      {item.quantity}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      / {item.reorderPoint}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {items.length > 5 && (
              <div className="border-t p-3">
                <Link
                  href="/assets/inventory?filter=low-stock"
                  className="block text-center text-xs font-bold text-primary hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  View all {items.length} items →
                </Link>
              </div>
            )}

            <div className="border-t p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                asChild
              >
                <Link href="/assets/inventory?filter=low-stock">
                  Manage Inventory
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
