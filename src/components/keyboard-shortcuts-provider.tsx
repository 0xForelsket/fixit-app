"use client";

import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Provider component for global keyboard shortcuts.
 * Include this once in the app layout to enable shortcuts throughout.
 */
export function KeyboardShortcutsProvider() {
  const { helpOpen, setHelpOpen, goToMode } = useKeyboardShortcuts();

  return (
    <KeyboardShortcutsHelp
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      goToMode={goToMode}
    />
  );
}
