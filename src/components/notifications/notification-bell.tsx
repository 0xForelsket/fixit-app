"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { NotificationType } from "@/db/schema";
import {
  type Notification,
  useNotificationsSSE,
} from "@/hooks/use-notifications-sse";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface NotificationBellProps {
  userId: number;
}

export function NotificationBell({ userId: _userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use SSE for real-time notifications
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationsSSE({
    onNewNotification: useCallback(
      (notification: Notification) => {
        toast({
          title: notification.title,
          description: notification.message,
        });
      },
      [toast]
    ),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "work_order_created":
        return <ClipboardList className="h-4 w-4 text-primary-600" />;
      case "work_order_assigned":
        return <User className="h-4 w-4 text-emerald-600" />;
      case "work_order_escalated":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "work_order_resolved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "work_order_commented":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "work_order_status_changed":
        return <RefreshCw className="h-4 w-4 text-violet-600" />;
      case "maintenance_due":
        return <Calendar className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="danger"
            className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-background shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notifications</h3>
              {/* Connection status indicator */}
              <span title={isConnected ? "Connected" : "Reconnecting..."}>
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-emerald-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-amber-500" />
                )}
              </span>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto text-xs py-1 px-2"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => handleMarkAsRead(notification.id)}
                    getIcon={getIcon}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-sm text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  getIcon,
}: {
  notification: Notification;
  onMarkRead: () => void;
  getIcon: (type: NotificationType) => React.ReactNode;
}) {
  const content = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors hover:bg-muted",
        !notification.isRead && "bg-primary-50/50 dark:bg-primary-950/20"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.isRead && "font-medium")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(new Date(notification.createdAt))}
        </p>
      </div>
      {!notification.isRead && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead();
          }}
          aria-label="Mark as read"
          className="shrink-0 rounded-full p-1 hover:bg-muted-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Mark as read"
        >
          <Check className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={onMarkRead}>
        {content}
      </Link>
    );
  }

  return content;
}
