"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import * as React from "react";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  type?: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<{
  activeItems: string[];
  toggleItem: (value: string) => void;
  accordionId: string;
} | null>(null);

export function Accordion({
  children,
  className,
  type = "single",
  collapsible = true,
}: AccordionProps) {
  const [activeItems, setActiveItems] = React.useState<string[]>([]);
  const accordionId = React.useId();

  const toggleItem = (value: string) => {
    setActiveItems((prev) => {
      const isAlreadyActive = prev.includes(value);
      if (isAlreadyActive) {
        if (collapsible) {
          return prev.filter((item) => item !== value);
        }
        return prev;
      }
      if (type === "single") {
        return [value];
      }
      return [...prev, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ activeItems, toggleItem, accordionId }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "border border-border rounded-xl overflow-hidden",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
          });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  children,
  className,
  value,
}: { children: React.ReactNode; className?: string; value?: string }) {
  const context = React.useContext(AccordionContext);
  if (!context)
    throw new Error("AccordionTrigger must be used within Accordion");

  const isActive = context.activeItems.includes(value!);
  const triggerId = `${context.accordionId}-trigger-${value}`;
  const contentId = `${context.accordionId}-content-${value}`;

  return (
    <h3>
      <button
        type="button"
        id={triggerId}
        onClick={() => context.toggleItem(value!)}
        aria-expanded={isActive}
        aria-controls={contentId}
        className={cn(
          "flex w-full items-center justify-between py-4 px-6 text-left transition-all hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
          className
        )}
      >
        {children}
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
    </h3>
  );
}

export function AccordionContent({
  children,
  className,
  value,
}: { children: React.ReactNode; className?: string; value?: string }) {
  const context = React.useContext(AccordionContext);
  if (!context)
    throw new Error("AccordionContent must be used within Accordion");

  const isActive = context.activeItems.includes(value!);
  const triggerId = `${context.accordionId}-trigger-${value}`;
  const contentId = `${context.accordionId}-content-${value}`;

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className={cn("px-6 pb-6 pt-0 text-muted-foreground", className)}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
