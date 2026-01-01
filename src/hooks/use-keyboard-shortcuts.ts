"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface KeyboardShortcut {
  key: string;
  modifiers?: ("ctrl" | "meta" | "shift" | "alt")[];
  description: string;
  action: () => void;
  category: "navigation" | "actions" | "global";
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Hook for global keyboard shortcuts.
 * Handles common shortcuts like navigation and actions.
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      // Global
      {
        key: "k",
        modifiers: ["meta"],
        description: "Open command menu",
        action: () => {
          document.dispatchEvent(new CustomEvent("toggle-command-menu"));
        },
        category: "global",
      },
      {
        key: "k",
        modifiers: ["ctrl"],
        description: "Open command menu",
        action: () => {
          document.dispatchEvent(new CustomEvent("toggle-command-menu"));
        },
        category: "global",
      },
      {
        key: "/",
        modifiers: ["ctrl"],
        description: "Focus search",
        action: () => {
          // Try to find and focus a search input
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Search"], input[aria-label*="Search"], [data-search-input]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          } else {
            // Fallback to command menu
            document.dispatchEvent(new CustomEvent("toggle-command-menu"));
          }
        },
        category: "global",
      },
      {
        key: "?",
        modifiers: ["shift"],
        description: "Show keyboard shortcuts",
        action: () => setHelpOpen(true),
        category: "global",
      },
      {
        key: "Escape",
        description: "Close dialogs",
        action: () => setHelpOpen(false),
        category: "global",
      },
      // Navigation
      {
        key: "g",
        description: "Go to... (press then d/w/e/i/a/s/l/p)",
        action: () => {},
        category: "navigation",
      },
      {
        key: "h",
        modifiers: ["shift"],
        description: "Go to Dashboard",
        action: () => router.push("/dashboard"),
        category: "navigation",
      },
      {
        key: "w",
        modifiers: ["shift"],
        description: "Go to Work Orders",
        action: () => router.push("/maintenance/work-orders"),
        category: "navigation",
      },
      {
        key: "e",
        modifiers: ["shift"],
        description: "Go to Equipment",
        action: () => router.push("/assets/equipment"),
        category: "navigation",
      },
      {
        key: "i",
        modifiers: ["shift"],
        description: "Go to Inventory",
        action: () => router.push("/assets/inventory"),
        category: "navigation",
      },
      {
        key: "a",
        modifiers: ["shift"],
        description: "Go to Analytics",
        action: () => router.push("/analytics"),
        category: "navigation",
      },
      // List navigation
      {
        key: "j",
        description: "Next item in list",
        action: () => {
          document.dispatchEvent(
            new CustomEvent("list-navigate", { detail: { direction: "down" } })
          );
        },
        category: "navigation",
      },
      {
        key: "k",
        description: "Previous item in list",
        action: () => {
          document.dispatchEvent(
            new CustomEvent("list-navigate", { detail: { direction: "up" } })
          );
        },
        category: "navigation",
      },
      // Actions
      {
        key: "n",
        modifiers: ["ctrl"],
        description: "New work order",
        action: () => router.push("/report"),
        category: "actions",
      },
      {
        key: "n",
        modifiers: ["meta"],
        description: "New work order",
        action: () => router.push("/report"),
        category: "actions",
      },
      {
        key: "n",
        description: "New work order (no modifier)",
        action: () => router.push("/report"),
        category: "actions",
      },
      {
        key: "r",
        description: "Report issue",
        action: () => router.push("/report"),
        category: "actions",
      },
      {
        key: "p",
        modifiers: ["ctrl"],
        description: "Print current page",
        action: () => window.print(),
        category: "actions",
      },
    ],
    [router]
  );

  // Go-to mode: Press 'g' then another key for navigation
  const [goToMode, setGoToMode] = useState(false);
  const [goToTimeout, setGoToTimeout] = useState<NodeJS.Timeout | null>(null);

  const goToShortcuts: Record<string, string> = useMemo(
    () => ({
      d: "/dashboard",
      w: "/maintenance/work-orders",
      e: "/assets/equipment",
      i: "/assets/inventory",
      a: "/analytics",
      s: "/maintenance/schedules",
      l: "/assets/locations",
      p: "/profile",
    }),
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // Handle go-to mode
      if (goToMode) {
        const path = goToShortcuts[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          router.push(path);
        }
        setGoToMode(false);
        if (goToTimeout) clearTimeout(goToTimeout);
        return;
      }

      // Enter go-to mode on 'g'
      if (
        e.key === "g" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        setGoToMode(true);
        const timeout = setTimeout(() => setGoToMode(false), 1500);
        setGoToTimeout(timeout);
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const modifiers = shortcut.modifiers || [];

        const metaRequired = modifiers.includes("meta");
        const ctrlRequired = modifiers.includes("ctrl");
        const shiftRequired = modifiers.includes("shift");
        const altRequired = modifiers.includes("alt");

        const modifiersMatch =
          e.metaKey === metaRequired &&
          e.ctrlKey === ctrlRequired &&
          e.shiftKey === shiftRequired &&
          e.altKey === altRequired;

        // Special case for '?' which requires shift
        if (shortcut.key === "?" && e.key === "?" && e.shiftKey) {
          e.preventDefault();
          shortcut.action();
          return;
        }

        if (keyMatches && modifiersMatch && shortcut.key !== "g") {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled, goToMode, goToTimeout, router, shortcuts, goToShortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    // Listen for custom event to toggle help
    const handleToggleKey = () => setHelpOpen((prev) => !prev);
    document.addEventListener("toggle-keyboard-shortcuts", handleToggleKey);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(
        "toggle-keyboard-shortcuts",
        handleToggleKey
      );
      if (goToTimeout) clearTimeout(goToTimeout);
    };
  }, [handleKeyDown, goToTimeout]);

  return {
    shortcuts,
    goToShortcuts,
    helpOpen,
    setHelpOpen,
    goToMode,
  };
}
