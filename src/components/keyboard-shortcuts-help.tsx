"use client";
import { Keyboard, X } from "lucide-react";
import { useEffect } from "react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  goToMode?: boolean;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

const categories: ShortcutCategory[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open search" },
      { keys: ["?"], description: "Show this help" },
      { keys: ["Esc"], description: "Close dialogs" },
    ],
  },
  {
    title: "Go To (press G first)",
    shortcuts: [
      { keys: ["G", "D"], description: "Dashboard" },
      { keys: ["G", "W"], description: "Work Orders" },
      { keys: ["G", "E"], description: "Equipment" },
      { keys: ["G", "I"], description: "Inventory" },
      { keys: ["G", "A"], description: "Analytics" },
      { keys: ["G", "S"], description: "Schedules" },
      { keys: ["G", "L"], description: "Locations" },
      { keys: ["G", "P"], description: "Profile" },
    ],
  },
  {
    title: "Quick Navigation",
    shortcuts: [
      { keys: ["⇧", "H"], description: "Go to Dashboard" },
      { keys: ["⇧", "W"], description: "Go to Work Orders" },
      { keys: ["⇧", "E"], description: "Go to Equipment" },
      { keys: ["⇧", "I"], description: "Go to Inventory" },
      { keys: ["⇧", "A"], description: "Go to Analytics" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["N"], description: "New work order" },
      { keys: ["R"], description: "Report issue" },
    ],
  },
];

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp({
  open,
  onClose,
  goToMode,
}: KeyboardShortcutsHelpProps) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close shortcuts help"
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Keyboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
                <p className="text-xs text-muted-foreground">
                  Quick navigation and actions
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Go-to mode indicator */}
          {goToMode && (
            <div className="px-6 py-3 bg-primary/10 border-b border-primary/20">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <span className="animate-pulse">●</span>
                Go-to mode active - press a key to navigate
              </p>
            </div>
          )}

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-sm text-foreground/80">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={key} className="flex items-center gap-1">
                              <KeyboardKey>{key}</KeyboardKey>
                              {i < shortcut.keys.length - 1 && (
                                <span className="text-xs text-muted-foreground">
                                  then
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-3 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Press <KeyboardKey>?</KeyboardKey> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
