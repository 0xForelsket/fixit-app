"use client";

import { useOnlineStatus } from "@/hooks/use-offline";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
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
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out",
        showBanner
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isOffline ? (
          // Offline toast
          <div className="bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-md text-white py-3 px-6 rounded-2xl flex items-center gap-4 shadow-[0_8px_32px_rgba(245,158,11,0.3)] border border-amber-400/20">
            <div className="bg-white/20 p-2 rounded-xl">
              <WifiOff className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight">System Offline</span>
              <span className="text-xs text-amber-50/90 leading-tight">
                Limited functionality. Changes will sync later.
              </span>
            </div>
          </div>
        ) : (
          // Back online toast
          <div className="bg-emerald-500/90 dark:bg-emerald-600/90 backdrop-blur-md text-white py-3 px-6 rounded-2xl flex items-center gap-4 shadow-[0_8px_32px_rgba(16,185,129,0.3)] border border-emerald-400/20">
            <div className="bg-white/20 p-2 rounded-xl">
              <Wifi className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight">Back Online</span>
              <span className="text-xs text-emerald-50/90 leading-tight">
                Connection restored. Syncing data...
              </span>
            </div>
          </div>
        )}
      </div>
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
        "flex items-center gap-2 text-amber-600 bg-amber-500/10 dark:bg-amber-400/10 backdrop-blur-sm border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse",
        className
      )}
      aria-label="Offline"
    >
      <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
      <span>Offline</span>
    </output>
  );
}
