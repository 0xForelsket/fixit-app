"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  title: string;
  userId: number;
  onMenuClick?: () => void;
}

export function Header({ title, userId, onMenuClick }: HeaderProps) {
  return (
    <header className="relative flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6 sticky top-0 z-40 transition-colors duration-300">
      {/* Industrial accent bar - only show in industrial theme via global CSS or simple conditional */}
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

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell userId={userId} />
      </div>
    </header>
  );
}
