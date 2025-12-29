"use client";

import { useEffect, useState, useCallback } from "react";

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to detect online/offline status with browser events.
 * Provides current status and whether the user was recently offline.
 *
 * @returns OfflineStatus object with isOnline, isOffline, and wasOffline flags
 */
export function useOnlineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state based on browser
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true for a short period to show "back online" message
      setTimeout(() => setWasOffline(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  };
}

// Queue item type for offline operations
export interface OfflineQueueItem<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
}

// Storage key for offline queue
const OFFLINE_QUEUE_KEY = "fixit_offline_queue";

/**
 * Hook to manage an offline queue for operations that should be retried when online.
 * Persists queue to localStorage.
 */
export function useOfflineQueue<T = unknown>() {
  const [queue, setQueue] = useState<OfflineQueueItem<T>[]>([]);
  const { isOnline } = useOnlineStatus();

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }, [queue]);

  // Add item to queue
  const enqueue = useCallback((type: string, data: T) => {
    const item: OfflineQueueItem<T> = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    setQueue((prev) => [...prev, item]);
    return item.id;
  }, []);

  // Remove item from queue
  const dequeue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Process queue when online
  const processQueue = useCallback(
    async (
      processor: (item: OfflineQueueItem<T>) => Promise<boolean>
    ): Promise<{ success: number; failed: number }> => {
      if (!isOnline || queue.length === 0) {
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      for (const item of queue) {
        try {
          const result = await processor(item);
          if (result) {
            dequeue(item.id);
            success++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      return { success, failed };
    },
    [isOnline, queue, dequeue]
  );

  return {
    queue,
    queueLength: queue.length,
    enqueue,
    dequeue,
    clearQueue,
    processQueue,
  };
}
