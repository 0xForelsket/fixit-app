"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { NotificationType } from "@/db/schema";
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
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 30000; // 30 seconds

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string | number;
}

interface NotificationBellProps {
  userId: number;
}

export function NotificationBell({ userId: _userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef<number | null>(null);
  const { toast } = useToast();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const newNotifications: Notification[] = data.notifications || [];
        setNotifications(newNotifications);

        // Check for new notifications and show toast
        const newUnreadCount = newNotifications.filter((n) => !n.isRead).length;
        if (
          prevUnreadCountRef.current !== null &&
          newUnreadCount > prevUnreadCountRef.current
        ) {
          const diff = newUnreadCount - prevUnreadCountRef.current;
          toast({
            title: "New Notification",
            description: `You have ${diff} new notification${diff > 1 ? "s" : ""}.`,
          });
        }
        prevUnreadCountRef.current = newUnreadCount;
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch notifications with polling
  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

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

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // Update ref to avoid false toast on next poll
      if (prevUnreadCountRef.current !== null) {
        prevUnreadCountRef.current = Math.max(
          0,
          prevUnreadCountRef.current - 1
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      prevUnreadCountRef.current = 0;
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
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
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto text-xs py-1 px-2"
                onClick={markAllAsRead}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
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
                    onMarkRead={() => markAsRead(notification.id)}
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
          className="shrink-0 rounded-full p-1 hover:bg-muted-foreground/20"
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
