"use client";

import type { NotificationType } from "@/db/schema";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string | number;
}

interface UseNotificationsSSEOptions {
  onNewNotification?: (notification: Notification) => void;
  enabled?: boolean;
}

interface UseNotificationsSSEReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotificationsSSE(
  options: UseNotificationsSSEOptions = {}
): UseNotificationsSSEReturn {
  const { onNewNotification, enabled = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const onNewNotificationRef = useRef(onNewNotification);

  // Keep callback ref updated
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Connect to SSE
  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/sse/notifications");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    // Handle initial notifications
    eventSource.addEventListener("init", (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications(data.notifications || []);
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse init event:", e);
      }
    });

    // Handle new notification
    eventSource.addEventListener("notification", (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        setNotifications((prev) => [notification, ...prev].slice(0, 20));

        // Trigger callback for toast/sound
        if (onNewNotificationRef.current) {
          onNewNotificationRef.current(notification);
        }
      } catch (e) {
        console.error("Failed to parse notification event:", e);
      }
    });

    // Handle notification read update
    eventSource.addEventListener("read", (event) => {
      try {
        const { id } = JSON.parse(event.data);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } catch (e) {
        console.error("Failed to parse read event:", e);
      }
    });

    // Handle all read
    eventSource.addEventListener("read-all", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Exponential backoff reconnection
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
      reconnectAttempts.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) {
          connect();
        }
      }, delay);
    };
  }, [enabled]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const prevNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });
    } catch (e) {
      console.error("Failed to mark all as read:", e);
      // Revert on error
      setNotifications(prevNotifications);
    }
  }, [notifications]);

  // Manual refetch (fallback)
  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to refetch notifications:", e);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
