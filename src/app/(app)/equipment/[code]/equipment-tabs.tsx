"use client";

import {
  PillTabs,
  PillTabsContent,
  PillTabsList,
  PillTabsTrigger,
} from "@/components/ui/pill-tabs";
import { AlertTriangle, Calendar, ClipboardList, History } from "lucide-react";
import { useEffect, useState } from "react";

interface EquipmentTabsProps {
  equipmentId: number;
  overviewContent: React.ReactNode;
  historyContent: React.ReactNode;
  maintenanceContent: React.ReactNode;
  reportContent: React.ReactNode;
  defaultTab?: string;
}

export function EquipmentTabs({
  overviewContent,
  historyContent,
  maintenanceContent,
  reportContent,
  defaultTab = "overview",
}: EquipmentTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "history", "maintenance", "report"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Check on mount
    handleHash();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <PillTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <PillTabsList>
        <PillTabsTrigger
          value="overview"
          onClick={() => {
            window.location.hash = "overview";
          }}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Overview</span>
        </PillTabsTrigger>
        <PillTabsTrigger
          value="history"
          onClick={() => {
            window.location.hash = "history";
          }}
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
        </PillTabsTrigger>
        <PillTabsTrigger
          value="maintenance"
          onClick={() => {
            window.location.hash = "maintenance";
          }}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PM</span>
          <span className="sm:hidden">PM</span>
        </PillTabsTrigger>
        <PillTabsTrigger
          value="report"
          onClick={() => {
            window.location.hash = "report";
          }}
          className="data-[state=active]:text-danger-600 hover:text-danger-600 text-zinc-500"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Report</span>
          <span className="sm:hidden">Report</span>
        </PillTabsTrigger>
      </PillTabsList>

      <PillTabsContent value="overview">{overviewContent}</PillTabsContent>

      <PillTabsContent value="history">{historyContent}</PillTabsContent>

      <PillTabsContent value="maintenance">
        {maintenanceContent}
      </PillTabsContent>

      <PillTabsContent value="report">{reportContent}</PillTabsContent>
    </PillTabs>
  );
}
