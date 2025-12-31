"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  title: string;
  userId: number;
  onMenuClick?: () => void;
}

export function Header({ title, userId, onMenuClick }: HeaderProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <header className="relative flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6 sticky top-0 z-40 transition-colors duration-300 print:hidden">
      {/* Industrial accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-0 [[data-theme='industrial']_&]:opacity-100 dark:opacity-100 transition-opacity" />

      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-muted-foreground hover:text-primary hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-black tracking-tight text-foreground uppercase font-serif-brand">
          {title}
        </h1>
      </div>

      <div className="flex-1 flex justify-center max-w-md px-4 hidden md:flex">
        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("toggle-command-menu"))
          }
          className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground hover:bg-muted hover:border-primary/20 transition-all group cursor-pointer"
        >
          <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium">Quick search...</span>
          <div className="ml-auto flex items-center gap-1 opacity-60">
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono font-bold">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono font-bold">
              K
            </kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("toggle-command-menu"))
          }
          className="md:hidden text-muted-foreground hover:text-primary"
        >
          <Search className="h-5 w-5" />
        </Button>
        <ThemeToggle />
        <NotificationBell userId={userId} />
      </div>
    </header>
  );
}
