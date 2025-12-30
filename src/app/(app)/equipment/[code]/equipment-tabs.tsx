"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="flex w-full h-10 p-1 bg-zinc-100/80 rounded-lg gap-1">
        <TabsTrigger
          value="overview"
          onClick={() => {
            window.location.hash = "overview";
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-full text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-md transition-all"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger
          value="history"
          onClick={() => {
            window.location.hash = "history";
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-full text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-md transition-all"
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
        </TabsTrigger>
        <TabsTrigger
          value="maintenance"
          onClick={() => {
            window.location.hash = "maintenance";
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-full text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-md transition-all"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PM</span>
          <span className="sm:hidden">PM</span>
        </TabsTrigger>
        <TabsTrigger
          value="report"
          onClick={() => {
            window.location.hash = "report";
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-full text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-danger-600 data-[state=active]:shadow-sm rounded-md transition-all"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Report</span>
          <span className="sm:hidden">Report</span>
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
