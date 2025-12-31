"use client";

import {
  PillTabs,
  PillTabsContent,
  PillTabsList,
  PillTabsTrigger,
} from "@/components/ui/pill-tabs";
import { ClipboardCheck, ClipboardList, History, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface WorkOrderTabsProps {
  workOrderId: number;
  overviewContent: React.ReactNode;
  procedureContent: React.ReactNode;
  activityContent: React.ReactNode;
  resourcesContent: React.ReactNode;
  defaultTab?: string;
}

export function WorkOrderTabs({
  overviewContent,
  procedureContent,
  activityContent,
  resourcesContent,
  defaultTab = "overview",
}: WorkOrderTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "procedure", "activity", "resources"].includes(hash)) {
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
          value="procedure"
          onClick={() => {
            window.location.hash = "procedure";
          }}
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Procedure</span>
        </PillTabsTrigger>
        <PillTabsTrigger
          value="activity"
          onClick={() => {
            window.location.hash = "activity";
          }}
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Activity</span>
        </PillTabsTrigger>
        <PillTabsTrigger
          value="resources"
          onClick={() => {
            window.location.hash = "resources";
          }}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Resources</span>
        </PillTabsTrigger>
      </PillTabsList>

      <PillTabsContent value="overview">{overviewContent}</PillTabsContent>

      <PillTabsContent value="procedure">{procedureContent}</PillTabsContent>

      <PillTabsContent value="activity">{activityContent}</PillTabsContent>

      <PillTabsContent value="resources">{resourcesContent}</PillTabsContent>
    </PillTabs>
  );
}
