"use client";

import { useOnlineStatus } from "@/hooks/use-offline";
import { cn } from "@/lib/utils";
import { WifiOff, Wifi, CloudOff } from "lucide-react";
import { useEffect, useState } from "react";

interface OfflineIndicatorProps {
  className?: string;
  showOnlineMessage?: boolean;
}

/**
 * Offline Indicator Component
 *
 * Shows a banner when the user is offline, and optionally a "back online"
 * message when connectivity is restored.
 *
 * Features:
 * - Animated slide-in/out
 * - Auto-hides "back online" message after a few seconds
 * - Clear visual distinction between offline and back-online states
 */
export function OfflineIndicator({
  className,
  showOnlineMessage = true,
}: OfflineIndicatorProps) {
  const { isOffline, wasOffline } = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowBanner(true);
    } else if (wasOffline && showOnlineMessage) {
      setShowBanner(true);
      // Hide the banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOffline, wasOffline, showOnlineMessage]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out",
        showBanner ? "translate-y-0" : "translate-y-full",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {isOffline ? (
        // Offline banner
        <div className="bg-amber-600 text-white py-3 px-4 flex items-center justify-center gap-3 shadow-lg">
          <WifiOff className="h-5 w-5 animate-pulse" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-semibold">You&apos;re offline</span>
            <span className="text-sm text-amber-100">
              Some features may be limited. Changes will sync when you reconnect.
            </span>
          </div>
        </div>
      ) : (
        // Back online banner
        <div className="bg-emerald-600 text-white py-3 px-4 flex items-center justify-center gap-3 shadow-lg">
          <Wifi className="h-5 w-5" />
          <span className="font-semibold">Back online!</span>
          <span className="text-sm text-emerald-100">
            Your connection has been restored.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact offline indicator for use in headers/navbars.
 * Shows only when offline.
 */
export function OfflineIndicatorCompact({ className }: { className?: string }) {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <output
      className={cn(
        "flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium",
        className
      )}
      aria-label="Offline"
    >
      <CloudOff className="h-4 w-4" />
      <span>Offline</span>
    </output>
  );
}
