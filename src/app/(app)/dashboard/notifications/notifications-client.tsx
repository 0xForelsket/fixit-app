"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ClipboardList,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

export function NotificationsClient({
  initialNotifications,
}: NotificationsClientProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const markAsRead = (id: string) => {
    startTransition(async () => {
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
    });
  };

  const markAllAsRead = () => {
    startTransition(async () => {
      try {
        await fetch("/api/notifications/read-all", {
          method: "POST",
        });
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (error) {
        console.error("Failed to mark all as read:", error);
      }
    });
  };

  const deleteNotification = (id: string) => {
    startTransition(async () => {
      try {
        await fetch(`/api/notifications/${id}`, {
          method: "DELETE",
        });
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ticket_created":
        return <ClipboardList className="h-5 w-5 text-primary" />;
      case "ticket_assigned":
        return <User className="h-5 w-5 text-emerald-600" />;
      case "ticket_escalated":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "maintenance_due":
        return <Calendar className="h-5 w-5 text-rose-600" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ticket_created":
        return "New Ticket";
      case "ticket_assigned":
        return "Assignment";
      case "ticket_escalated":
        return "Escalation";
      case "maintenance_due":
        return "Maintenance";
      default:
        return "Notification";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
          <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === "unread"
              ? "You're all caught up!"
              : "We'll notify you when something important happens"}
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-card overflow-hidden">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-4 p-4 transition-colors",
                !notification.isRead && "bg-primary/5"
              )}
            >
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {getIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(notification.type)}
                  </Badge>
                  {!notification.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>

                {notification.link ? (
                  <Link
                    href={notification.link}
                    className="block hover:underline"
                    onClick={() =>
                      !notification.isRead && markAsRead(notification.id)
                    }
                  >
                    <p
                      className={cn(
                        "font-medium",
                        !notification.isRead && "text-foreground"
                      )}
                    >
                      {notification.title}
                    </p>
                  </Link>
                ) : (
                  <p
                    className={cn(
                      "font-medium",
                      !notification.isRead && "text-foreground"
                    )}
                  >
                    {notification.title}
                  </p>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>

                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(notification.createdAt))}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsRead(notification.id)}
                    disabled={isPending}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteNotification(notification.id)}
                  disabled={isPending}
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
