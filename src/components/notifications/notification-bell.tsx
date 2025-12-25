"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ClipboardList,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Notification {
  id: number;
  type:
    | "ticket_created"
    | "ticket_assigned"
    | "ticket_escalated"
    | "maintenance_due";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string | number; // Comes as string/timestamp from JSON API
}

interface NotificationBellProps {
  userId: number;
}

export function NotificationBell({ userId: _userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

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
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ticket_created":
        return <ClipboardList className="h-4 w-4 text-primary-600" />;
      case "ticket_assigned":
        return <User className="h-4 w-4 text-emerald-600" />;
      case "ticket_escalated":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
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
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-white shadow-lg z-50">
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
                className="block text-center text-sm text-primary-600 hover:underline"
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
  getIcon: (type: string) => React.ReactNode;
}) {
  const content = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
        !notification.isRead && "bg-primary-50/50"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
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
          className="shrink-0 rounded-full p-1 hover:bg-slate-200"
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
