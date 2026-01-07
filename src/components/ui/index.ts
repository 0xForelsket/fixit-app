/**
 * UI Components Index
 *
 * This file re-exports all UI components organized by category.
 * You can import from specific categories for better organization:
 *
 * @example
 * // Category imports (recommended for multiple from same category)
 * import { Button, Card, Badge } from "@/components/ui/primitives";
 * import { DataTable, StatsCard } from "@/components/ui/data-display";
 * import { useToast, Skeleton } from "@/components/ui/feedback";
 *
 * // Or import everything from this file
 * import { Button, DataTable, useToast } from "@/components/ui";
 */

// Primitives - Core building blocks
export * from "./primitives";

// Forms - Form-related components
export * from "./forms";

// Feedback - Status, loading, and error states
export * from "./feedback";

// Data Display - Tables, stats, and data visualization
export * from "./data-display";

// Navigation - Navigation and routing components
export * from "./navigation";

// Overlays - Dialogs, dropdowns, and modals
export * from "./overlays";

// Layout - Page structure components
export * from "./layout";

// Filters - Filtering and sorting components
export * from "./filters";
