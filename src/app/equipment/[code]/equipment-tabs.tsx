"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ClipboardList, History, AlertTriangle } from "lucide-react";

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
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-zinc-100 rounded-xl">
        <TabsTrigger
          value="overview"
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm rounded-lg"
        >
          <ClipboardList className="h-4 w-4" />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm rounded-lg"
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </TabsTrigger>
        <TabsTrigger
          value="maintenance"
          className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm rounded-lg"
        >
          <Calendar className="h-4 w-4" />
          <span>PM</span>
        </TabsTrigger>
        <TabsTrigger
          value="report"
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
