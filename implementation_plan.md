# Standardization Implementation Plan

This plan details the steps to standardize the UI components across the application, focusing on reducing visual inconsistencies and code duplication.

## Phase 1: Core Component Standardization

### 1. Stats Cards Consolidation
**Problem:** Multiple conflicting implementations of "Stats Cards" exist in `components/dashboard`, `components/ui`, and locally in page files.
**Goal:** Create a single, flexible `StatsCard` component.

*   [ ] **Create `src/components/ui/stats-card.tsx`**:
    *   Design it to match the "Industrial" look (bold fonts, zinc colors).
    *   Support props: `title`, `value`, `icon`, `subtext` (e.g. "6 ONLINE"), `variant` (default, danger, success), `href` (optional link wrapper).
    *   Include animations (`hover-lift`, `animate-in`) by default.
*   [ ] **Refactor Pages to Use New Component**:
    *   `src/app/(main)/assets/equipment/page.tsx`
    *   `src/app/(main)/assets/inventory/page.tsx`
    *   `src/app/(main)/dashboard/page.tsx`
    *   `src/app/(main)/reports/page.tsx`
*   [ ] **Delete Obsolete Files**:
    *   Remove `src/components/dashboard/stats-card.tsx` (if fully replaced).
    *   Remove local component definitions from page files.

### 2. Status Badges & Indicators
**Problem:** Pages manually define color maps (`statusConfig`) for "Open", "Closed", "Critical", etc.
**Goal:** Centralize status logic in `Badge` component and a reusable helper for common status types.

*   [ ] **Enhance `src/components/ui/badge.tsx`**:
    *   Standardize `status` variants: `success` (Operational/Resolved), `warning` (Maintenance/High), `danger` (Down/Critical), `neutral` (Closed/Low).
    *   Add a "Pill" variant specifically for table status columns (dot + text).
*   [ ] **Create `StatusBadge` Helper (Optional)**:
    *   A component that accepts a `status` string (e.g., "operational") and automatically selects the correct variant and icon.

### 3. Page Header Component
**Problem:** Every page manually implements the flex headers, titles, and button layouts.
**Goal:** Create a `<PageHeader>` component.

*   [ ] **Create `src/components/ui/page-header.tsx`**:
    *   **Props**: `title`, `subtitle` (optional stats line), `actions` (ReactNode of buttons).
    *   **Styling**: Enforce the `uppercase`, `font-black`, `tracking-tight` typography automatically.
*   [ ] **Refactor Pages**:
    *   Replace header sections in Equipment, Inventory, Reports, Users, Locations.

## Phase 2: Refactoring & Cleanup

### 4. Codebase Cleanup
*   [ ] **Scan for Local Stylings**:
    *   Find any remaining `bg-primary-500` or manual shadow classes on Buttons and Cards.
    *   Replace with component variants.
*   [ ] **Standardize Tables**:
    *   Ensure all tables use the `SortHeader` and standard `Table` components (mostly done, but verify logic is consistent).

## Phase 3: Visual Polish

### 5. Interaction Patterns
*   [ ] **Hover Effects**: Ensure all "clickable" standard list items (like recent parts) use the same `hover-lift` and `border-primary-400` effect.
*   [ ] **Empty States**: Create a standard `<EmptyState />` component for when tables have no data, replacing the copy-pasted dashed border divs.

---
**Status:** Planning
**Next Step:** Begin Phase 1 - Consolidation of Stats Cards.
