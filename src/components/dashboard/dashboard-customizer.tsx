"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Eye, EyeOff, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";

export type WidgetId = "personal-stats" | "global-stats" | "my-queue" | "global-queue";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  description: string;
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: "personal-stats",
    label: "My Statistics",
    description: "Your assigned work order statistics",
  },
  {
    id: "global-stats",
    label: "System Overview",
    description: "Organization-wide work order stats",
  },
  {
    id: "my-queue",
    label: "My Queue",
    description: "Your assigned work orders list",
  },
  {
    id: "global-queue",
    label: "Priority Queue",
    description: "All open work orders in the system",
  },
];

const DEFAULT_VISIBLE_WIDGETS: WidgetId[] = [
  "personal-stats",
  "global-stats",
  "my-queue",
  "global-queue",
];

const STORAGE_KEY = "dashboard_widget_preferences";

interface DashboardPreferences {
  visibleWidgets: WidgetId[];
}

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    visibleWidgets: DEFAULT_VISIBLE_WIDGETS,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardPreferences;
        setPreferences(parsed);
      }
    } catch {
      // Use defaults on error
    }
    setIsLoaded(true);
  }, []);

  const updatePreferences = (newPrefs: DashboardPreferences) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleWidget = (widgetId: WidgetId) => {
    const currentVisible = preferences.visibleWidgets;
    const newVisible = currentVisible.includes(widgetId)
      ? currentVisible.filter((id) => id !== widgetId)
      : [...currentVisible, widgetId];
    updatePreferences({ ...preferences, visibleWidgets: newVisible });
  };

  const resetToDefaults = () => {
    updatePreferences({ visibleWidgets: DEFAULT_VISIBLE_WIDGETS });
  };

  const isWidgetVisible = (widgetId: WidgetId) =>
    preferences.visibleWidgets.includes(widgetId);

  return {
    preferences,
    isLoaded,
    toggleWidget,
    resetToDefaults,
    isWidgetVisible,
  };
}

interface DashboardCustomizerProps {
  preferences: DashboardPreferences;
  onToggleWidget: (widgetId: WidgetId) => void;
  onReset: () => void;
}

export function DashboardCustomizer({
  preferences,
  onToggleWidget,
  onReset,
}: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-[10px] font-black uppercase tracking-widest border-border hover:bg-muted"
      >
        <Settings2 className="h-3.5 w-3.5 mr-1.5" />
        Customize
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel */}
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-bold text-sm">Customize Dashboard</h3>
                <p className="text-xs text-muted-foreground">
                  Toggle widgets on or off
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

            <div className="p-2 space-y-1">
              {AVAILABLE_WIDGETS.map((widget) => {
                const isVisible = preferences.visibleWidgets.includes(widget.id);
                return (
                  <button
                    key={widget.id}
                    onClick={() => onToggleWidget(widget.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      isVisible
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        isVisible
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !isVisible && "text-muted-foreground"
                        )}
                      >
                        {widget.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {widget.description}
                      </p>
                    </div>
                    {isVisible && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Reset to defaults
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
