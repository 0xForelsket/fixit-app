"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, X } from "lucide-react";
import { useMemo } from "react";
import type { DateRangeFilter, DateRangePreset } from "./types";

interface DateRangePickerProps {
  value?: DateRangeFilter;
  onChange: (value: DateRangeFilter | undefined) => void;
  className?: string;
}

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "TODAY" },
  { value: "7d", label: "LAST 7 DAYS" },
  { value: "30d", label: "LAST 30 DAYS" },
  { value: "month", label: "THIS MONTH" },
  { value: "quarter", label: "THIS QUARTER" },
  { value: "year", label: "THIS YEAR" },
  { value: "custom", label: "CUSTOM RANGE" },
];

function getPresetDates(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  switch (preset) {
    case "today":
      return { startDate: today, endDate: today };
    case "7d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString().split("T")[0], endDate: today };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString().split("T")[0], endDate: today };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString().split("T")[0], endDate: today };
    }
    case "quarter": {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterStart, 1);
      return { startDate: start.toISOString().split("T")[0], endDate: today };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString().split("T")[0], endDate: today };
    }
    case "custom":
    default:
      return { startDate: "", endDate: "" };
  }
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const showCustomInputs = value?.preset === "custom";
  
  const displayValue = useMemo(() => {
    if (!value?.preset) return "all";
    return value.preset;
  }, [value]);

  const handlePresetChange = (preset: string) => {
    if (preset === "all") {
      onChange(undefined);
      return;
    }
    
    const presetValue = preset as DateRangePreset;
    if (presetValue === "custom") {
      onChange({
        preset: "custom",
        startDate: value?.startDate || "",
        endDate: value?.endDate || "",
      });
    } else {
      const dates = getPresetDates(presetValue);
      onChange({
        preset: presetValue,
        ...dates,
      });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      preset: "custom",
      startDate: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      preset: "custom",
      endDate: e.target.value,
    });
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className={`flex flex-col gap-3 ${className || ""}`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={displayValue} onValueChange={handlePresetChange}>
          <SelectTrigger className="h-9 w-[180px] text-xs font-bold uppercase tracking-wider">
            <SelectValue placeholder="SELECT RANGE" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-bold uppercase">
              ALL TIME
            </SelectItem>
            {DATE_PRESETS.map((preset) => (
              <SelectItem
                key={preset.value}
                value={preset.value}
                className="text-xs font-bold uppercase"
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {value?.preset && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleClear}
            title="Clear date filter"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showCustomInputs && (
        <div className="flex items-center gap-2 pl-6">
          <div className="relative group/date">
            <span className="absolute -top-2 left-2 px-1 bg-card text-[8px] font-black text-muted-foreground/60 tracking-tighter transition-colors group-focus-within/date:text-primary">
              FROM
            </span>
            <input
              type="date"
              value={value?.startDate || ""}
              onChange={handleStartDateChange}
              className="h-9 rounded-lg border-2 border-border/50 bg-card/80 px-3 text-[10px] font-bold uppercase tracking-wider transition-all focus-visible:border-primary/50 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5"
            />
          </div>
          <span className="text-[10px] font-black text-muted-foreground/40">—</span>
          <div className="relative group/date">
            <span className="absolute -top-2 left-2 px-1 bg-card text-[8px] font-black text-muted-foreground/60 tracking-tighter transition-colors group-focus-within/date:text-primary">
              TO
            </span>
            <input
              type="date"
              value={value?.endDate || ""}
              onChange={handleEndDateChange}
              className="h-9 rounded-lg border-2 border-border/50 bg-card/80 px-3 text-[10px] font-bold uppercase tracking-wider transition-all focus-visible:border-primary/50 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for widget-level date range selection
 */
export function WidgetDateRangePicker({ value, onChange }: DateRangePickerProps) {
  const displayValue = useMemo(() => {
    if (!value?.preset) return "all";
    return value.preset;
  }, [value]);

  const handlePresetChange = (preset: string) => {
    if (preset === "all") {
      onChange(undefined);
      return;
    }
    
    const presetValue = preset as DateRangePreset;
    const dates = getPresetDates(presetValue);
    onChange({
      preset: presetValue,
      ...dates,
    });
  };

  return (
    <Select value={displayValue} onValueChange={handlePresetChange}>
      <SelectTrigger className="h-7 w-[140px] text-[10px] font-bold uppercase tracking-wider">
        <Calendar className="h-3 w-3 mr-1" />
        <SelectValue placeholder="DATE RANGE" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-[10px] font-bold uppercase">
          ALL TIME
        </SelectItem>
        {DATE_PRESETS.filter(p => p.value !== "custom").map((preset) => (
          <SelectItem
            key={preset.value}
            value={preset.value}
            className="text-[10px] font-bold uppercase"
          >
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
