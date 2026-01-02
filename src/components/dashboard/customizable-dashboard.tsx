"use client";

import {
  DashboardCustomizer,
  useDashboardPreferences,
  type WidgetId,
} from "@/components/dashboard/dashboard-customizer";
import type { ReactNode } from "react";

interface CustomizableDashboardProps {
  personalStatsWidget: ReactNode;
  globalStatsWidget: ReactNode;
  myQueueWidget: ReactNode;
  globalQueueWidget: ReactNode;
  headerActions: ReactNode;
}

export function CustomizableDashboard({
  personalStatsWidget,
  globalStatsWidget,
  myQueueWidget,
  globalQueueWidget,
  headerActions,
}: CustomizableDashboardProps) {
  const { preferences, isLoaded, toggleWidget, resetToDefaults, isWidgetVisible } =
    useDashboardPreferences();

  // Show loading state while preferences load from localStorage
  if (!isLoaded) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  const widgetMap: Record<WidgetId, ReactNode> = {
    "personal-stats": personalStatsWidget,
    "global-stats": globalStatsWidget,
    "my-queue": myQueueWidget,
    "global-queue": globalQueueWidget,
  };

  // Stats section - renders in a 2-column grid
  const visibleStats = (["personal-stats", "global-stats"] as const).filter(
    (id) => isWidgetVisible(id)
  );

  // Queue section - renders vertically
  const visibleQueues = (["my-queue", "global-queue"] as const).filter((id) =>
    isWidgetVisible(id)
  );

  return (
    <>
      {/* Header actions with customizer */}
      <div className="flex items-center gap-2">
        {headerActions}
        <DashboardCustomizer
          preferences={preferences}
          onToggleWidget={toggleWidget}
          onReset={resetToDefaults}
        />
      </div>

      {/* Stats section */}
      {visibleStats.length > 0 && (
        <div
          className={`grid gap-6 ${
            visibleStats.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
          }`}
        >
          {visibleStats.map((id) => (
            <div key={id}>{widgetMap[id]}</div>
          ))}
        </div>
      )}

      {/* Queue section */}
      {visibleQueues.length > 0 && (
        <div className="space-y-8">
          {visibleQueues.map((id) => (
            <div key={id}>{widgetMap[id]}</div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {visibleStats.length === 0 && visibleQueues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">No widgets visible</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Use the Customize button to add widgets to your dashboard
          </p>
        </div>
      )}
    </>
  );
}
