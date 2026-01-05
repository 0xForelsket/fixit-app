"use client";

import {
  DashboardCustomizer,
  useDashboardPreferences,
} from "@/components/dashboard/dashboard-customizer";
import type { ReactNode } from "react";

interface DashboardHeaderActionsProps {
  children: ReactNode;
}

export function DashboardHeaderActions({
  children,
}: DashboardHeaderActionsProps) {
  const { preferences, toggleWidget, resetToDefaults } =
    useDashboardPreferences();

  return (
    <div className="flex items-center gap-2">
      {children}
      <DashboardCustomizer
        preferences={preferences}
        onToggleWidget={toggleWidget}
        onReset={resetToDefaults}
      />
    </div>
  );
}

interface DashboardStatsProps {
  personalStatsWidget: ReactNode;
  globalStatsWidget: ReactNode;
}

export function DashboardStats({
  personalStatsWidget,
  globalStatsWidget,
}: DashboardStatsProps) {
  const { isLoaded, isWidgetVisible } = useDashboardPreferences();

  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    );
  }

  const showPersonal = isWidgetVisible("personal-stats") && personalStatsWidget;
  const showGlobal = isWidgetVisible("global-stats");

  if (!showPersonal && !showGlobal) {
    return null;
  }

  return (
    <div
      className={`grid gap-6 ${
        showPersonal && showGlobal
          ? "grid-cols-1 xl:grid-cols-2"
          : "grid-cols-1"
      }`}
    >
      {showPersonal && <div>{personalStatsWidget}</div>}
      {showGlobal && <div>{globalStatsWidget}</div>}
    </div>
  );
}

interface DashboardContentProps {
  myQueueWidget: ReactNode;
  globalQueueWidget: ReactNode;
}

export function DashboardContent({
  myQueueWidget,
  globalQueueWidget,
}: DashboardContentProps) {
  const { isLoaded, isWidgetVisible } = useDashboardPreferences();

  if (!isLoaded) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  const showMyQueue = isWidgetVisible("my-queue") && myQueueWidget;
  const showGlobalQueue = isWidgetVisible("global-queue");

  if (!showMyQueue && !showGlobalQueue) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="font-semibold text-lg mb-2">No queues visible</h3>
        <p className="text-muted-foreground text-sm">
          Use the Customize button to add queue widgets
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showMyQueue && <div>{myQueueWidget}</div>}
      {showGlobalQueue && <div>{globalQueueWidget}</div>}
    </div>
  );
}
