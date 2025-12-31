"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Clock,
  Info,
  MessageSquare,
  Package,
} from "lucide-react";
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
    <div className="flex flex-col h-full lg:hidden bg-background">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="px-4 sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-2 pb-2 border-b border-border">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-card border border-border shadow-sm rounded-xl p-1">
            <TabsTrigger
              value="info"
              className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg transition-all text-muted-foreground"
            >
              <Info className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger
              value="checklist"
              className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg transition-all text-muted-foreground"
            >
              <ClipboardCheck className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg transition-all text-muted-foreground"
            >
              <MessageSquare className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg transition-all text-muted-foreground"
            >
              <Package className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg transition-all text-muted-foreground"
            >
              <Clock className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
          <TabsContent value="info" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {infoTab}
          </TabsContent>
          <TabsContent value="checklist" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {checklistTab}
          </TabsContent>
          <TabsContent value="comments" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {commentsTab}
          </TabsContent>
          <TabsContent value="inventory" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {inventoryTab}
          </TabsContent>
          <TabsContent value="logs" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {logsTab}
          </TabsContent>
        </div>
      </Tabs>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border z-30 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-6 safe-area-bottom">
        {actions}
      </div>
    </div>
  );
}
