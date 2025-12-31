"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  type?: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<{
  activeItems: string[];
  toggleItem: (value: string) => void;
} | null>(null);

export function Accordion({ children, className, type = "single", collapsible = true }: AccordionProps) {
  const [activeItems, setActiveItems] = React.useState<string[]>([]);

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
    <AccordionContext.Provider value={{ activeItems, toggleItem }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border border-border rounded-xl overflow-hidden", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({ children, className, value }: { children: React.ReactNode; className?: string; value?: string }) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionTrigger must be used within Accordion");

  const isActive = context.activeItems.includes(value!);
  const id = React.useId();

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(value!)}
      aria-expanded={isActive}
      aria-controls={`${id}-content`}
      className={cn(
        "flex w-full items-center justify-between py-4 px-6 text-left transition-all hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        className
      )}
    >
      {children}
      <motion.div
        animate={{ rotate: isActive ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    </button>
  );
}

export function AccordionContent({ children, className, value }: { children: React.ReactNode; className?: string; value?: string }) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionContent must be used within Accordion");

  const isActive = context.activeItems.includes(value!);
  // Note: ideally we'd pass the ID from trigger to content via context or prop
  // but for simplicity we'll just focus on visual/aria consistency here.

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="region"
        >
          <div className={cn("px-6 pb-6 pt-0 text-muted-foreground", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
