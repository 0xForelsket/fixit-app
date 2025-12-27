"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Info, MessageSquare, Package, ClipboardCheck } from "lucide-react";
import { useState } from "react";

interface MobileWorkOrderViewProps {
  infoTab: React.ReactNode;
  checklistTab: React.ReactNode;
  commentsTab: React.ReactNode;
  inventoryTab: React.ReactNode;
  logsTab: React.ReactNode;
  actions: React.ReactNode;
}

export function MobileWorkOrderView({
  infoTab,
  checklistTab,
  commentsTab,
  inventoryTab,
  logsTab,
  actions,
}: MobileWorkOrderViewProps) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="flex flex-col h-full lg:hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="px-4 sticky top-0 z-20 bg-zinc-50/80 backdrop-blur-md pt-2">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-white/50 border shadow-sm">
            <TabsTrigger value="info" className="gap-2">
              <Info className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Clock className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
          <TabsContent value="info" className="mt-0 space-y-6">
            {infoTab}
          </TabsContent>
          <TabsContent value="checklist" className="mt-0">
            {checklistTab}
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            {commentsTab}
          </TabsContent>
          <TabsContent value="inventory" className="mt-0">
            {inventoryTab}
          </TabsContent>
          <TabsContent value="logs" className="mt-0">
            {logsTab}
          </TabsContent>
        </div>
      </Tabs>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t z-30 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {actions}
      </div>
    </div>
  );
}
