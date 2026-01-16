"use client";

import { cn } from "@/lib/utils";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// Preset date ranges
const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 365 days", days: 365 },
] as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(toInputDate(value.startDate));
  const [customEnd, setCustomEnd] = useState(toInputDate(value.endDate));

  const handlePresetClick = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    onChange({ startDate, endDate });
    setCustomStart(toInputDate(startDate));
    setCustomEnd(toInputDate(endDate));
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);
    if (startDate <= endDate) {
      onChange({ startDate, endDate });
      setIsOpen(false);
    }
  };

  const displayText = `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`;

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-4 gap-2 font-mono text-xs"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{displayText}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border bg-popover/98 backdrop-blur-xl shadow-2xl p-2 animate-in fade-in-0 zoom-in-95">
            {/* Custom Date Inputs */}
            <div className="px-3 py-2 border-b border-border/50 mb-2">
              <div className="text-[9px] font-black text-muted-foreground/60 tracking-[0.2em] uppercase mb-2">
                Custom Range
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg border border-border bg-background text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg border border-border bg-background text-xs font-mono"
                />
              </div>
              <Button
                size="sm"
                onClick={handleCustomApply}
                className="w-full mt-2 h-8 text-xs"
              >
                Apply
              </Button>
            </div>

            {/* Quick Select */}
            <div className="text-[9px] font-black text-muted-foreground/60 tracking-[0.2em] uppercase px-3 py-2">
              Quick Select
            </div>
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => handlePresetClick(preset.days)}
                className="w-full text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

