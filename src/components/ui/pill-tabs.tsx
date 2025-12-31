"use client";

import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

const PillTabs = TabsPrimitive.Root;

const PillTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex w-full h-10 p-1 bg-muted/80 rounded-lg gap-1 border border-border/50",
      className
    )}
    {...props}
  />
));
PillTabsList.displayName = TabsPrimitive.List.displayName;

const PillTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex-1 flex items-center justify-center gap-1.5 h-full text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground",
      className
    )}
    {...props}
  />
));
PillTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const PillTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
      className
    )}
    {...props}
  />
));
PillTabsContent.displayName = TabsPrimitive.Content.displayName;

export { PillTabs, PillTabsList, PillTabsTrigger, PillTabsContent };
