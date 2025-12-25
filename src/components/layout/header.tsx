"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  userId: number;
  onMenuClick?: () => void;
}

export function Header({ title, userId, onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white/70 backdrop-blur-md px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-zinc-500 hover:text-primary-600 hover:bg-primary-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-black tracking-tight text-zinc-800 uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell userId={userId} />
      </div>
    </header>
  );
}
