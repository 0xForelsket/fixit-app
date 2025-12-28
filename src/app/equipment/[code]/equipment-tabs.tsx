"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Calendar, ClipboardList, History } from "lucide-react";

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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-zinc-100 rounded-xl">
        <TabsTrigger
          value="overview"
          onClick={() => {
            window.location.hash = "overview";
          }}
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-lg"
        >
          <ClipboardList className="h-4 w-4" />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger
          value="history"
          onClick={() => {
            window.location.hash = "history";
          }}
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-lg"
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </TabsTrigger>
        <TabsTrigger
          value="maintenance"
          onClick={() => {
            window.location.hash = "maintenance";
          }}
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-lg"
        >
          <Calendar className="h-4 w-4" />
          <span>PM</span>
        </TabsTrigger>
        <TabsTrigger
          value="report"
          onClick={() => {
            window.location.hash = "report";
          }}
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-danger-600 data-[state=active]:shadow-sm rounded-lg"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Report</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {overviewContent}
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        {historyContent}
      </TabsContent>

      <TabsContent value="maintenance" className="mt-6">
        {maintenanceContent}
      </TabsContent>

      <TabsContent value="report" className="mt-6">
        {reportContent}
      </TabsContent>
    </Tabs>
  );
}
