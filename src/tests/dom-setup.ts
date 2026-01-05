/**
 * DOM Test Setup - Provides testing-library utilities with proper happy-dom initialization
 *
 * Tests should import from this file instead of directly from @testing-library/react
 * to ensure DOM globals are available before screen is initialized.
 *
 * Usage in test files:
 *   import { render, screen, userEvent } from "@/tests/dom-setup";
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Only register if not already registered (prevents double registration when preload also runs)
if (typeof document === "undefined") {
  GlobalRegistrator.register();
}

// Re-export testing-library utilities
export { render, screen, within, waitFor } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
