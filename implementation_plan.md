# Component Standardization Handover Plan

**Objective:** Refactor the FixIt application to enforce a unified "Industrial" design system, eliminating ad-hoc styling and duplicate components.
**Target Agent:** Intermediate/Advanced React & Tailwind Specialist.

## 1. Design System "Source of Truth"

This project uses a custom "Industrial" design theme. All new components MUST adhere to these rules:

*   **Primary Color:** Industrial Orange (`primary-500`: `#f97316`). used for key actions and highlights.
*   **Neutrals:** Zinc (`zinc-900` for dark backgrounds/text, `zinc-50` for light backgrounds).
*   **Typography:**
    *   Headings: `Outfit` (sans-serif), typically `font-black`, `uppercase`, `tracking-tight`.
    *   Data/IDs: `JetBrains Mono` (monospace), `font-bold`.
*   **Shapes:**
    *   **Buttons:** `rounded-full` (Pill shape) for ALL buttons.
    *   **Cards/Containers:** `rounded-2xl` or `rounded-xl`.
    *   **Table Buttons:** "Ghost" variant for secondary actions, "Default" (Black Pill) for primary.
*   **Button Styles (Standardized via `src/components/ui/button.tsx`):**
    *   `default`: Black background (`bg-zinc-900`), white text, pill shape. Used for "Add", "Create".
    *   `outline`: White background, zinc border. **Hover:** Orange border/text (`hover:border-primary-500`). Used for "Export", "View".
    *   `ghost`: Subtle hover effects. Used for table actions or navigation.

## 2. Current State & Inconsistencies

We have just standardized the **Button** component globally. However, the rest of the UI has significant duplication:
1.  **Stats Cards:**
    *   `src/app/(main)/assets/equipment/page.tsx` has a local `StatsCard`.
    *   `src/app/(main)/assets/inventory/page.tsx` has a local `StatCard`.
    *   `src/components/dashboard/stats-card.tsx` exists but is used inconsistently.
    *   `src/components/ui/status-card.tsx` exists for simpler badges.
    *   **Goal:** Replace ALL of these with a single `src/components/ui/stats-card.tsx`.

2.  **Page Headers:**
    *   Every page manually implements the pattern: Title + Subtitle + Flex Container for Buttons.
    *   **Goal:** Create a standardized `<PageHeader />` component to enforce consistent spacing, font sizes, and layout.

3.  **Status Indicators:**
    *   Pages manually define color maps `const statusConfig = { ... }` for labels like "Operational", "Critical", etc.
    *   **Goal:** Centralize this into `src/components/ui/badge.tsx` or a new `StatusBadge` component.

## 3. Detailed Implementation Steps

### Phase 1: The Unified Stats Card (Highest Priority)
**Task:** Create one powerful card component to rule them all.

1.  **Create `src/components/ui/stats-card.tsx`**:
    *   **Props:**
        *   `title` (string, uppercase)
        *   `value` (string/number, huge font)
        *   `icon` (LucideIcon)
        *   `variant`: `'default'` (white bg), `'highlight'` (colored bg), `'outline'` (for dashboard).
        *   `trend`: `{ value: number, label: string, positive: boolean }` (optional).
        *   `href`: (optional wrapper).
    *   **Style:** `card-industrial` class (glassmorphism), `hover-lift` animation.
2.  **Refactor These Files:**
    *   Replace local `StatsCard` in `src/app/(main)/assets/equipment/page.tsx`.
    *   Replace local `StatCard` in `src/app/(main)/assets/inventory/page.tsx`.
    *   Update `src/app/(main)/dashboard/page.tsx`.
    *   Update `src/app/(main)/reports/page.tsx`.
3.  **Cleanup:** Delete the file `src/components/dashboard/stats-card.tsx` once unused.

### Phase 2: The Page Header Component
**Task:** Standardize page introductions.

1.  **Create `src/components/ui/page-header.tsx`**:
    *   **Props:**
        *   `title`: Main H1 text (e.g. "Equipment").
        *   `highlight`: Colored span text (e.g. "Master List").
        *   `description`: Subtitle text (e.g. "10 REGISTERED UNITS...").
        *   `icon`: Optional icon for the subtitle.
        *   `children`: The action buttons (right-aligned).
    *   **Implementation:** Use the flex layout currently seen in `assets/equipment/page.tsx` line 163.
2.  **Refactor:**
    *   Equipment Page (`/assets/equipment`)
    *   Inventory Page (`/assets/inventory`)
    *   Work Orders (`/maintenance/work-orders`)
    *   Users (`/admin/users`)

### Phase 3: Status & Badge Unification
**Task:** Stop repeating color maps.

1.  **Update `src/components/ui/badge.tsx`**:
    *   Ensure variants exist for: `operational` (green), `down` (red), `maintenance` (orange), `neutral` (zinc).
    *   Create a `<StatusBadge status={string} />` helper that automatically maps database string values (e.g. "in_progress") to the correct visual variant and text label.
2.  **Refactor Tables:**
    *   Update all DataTable implementations to use this component instead of local `statusConfig` maps.

## 4. Technical Context

*   **Framework:** Next.js 14+ (App Router).
*   **Styling:** Tailwind CSS with a custom configuration in `globals.css`.
    *   Use `@theme` variables like `--color-primary-500`.
    *   Use utility classes `card-industrial`, `hover-lift`, `animate-in` defined in `globals.css`.
*   **Icons:** `lucide-react`.

## 5. Verification Checklist

*   [ ] **Visual Consistency:** Do all Stats Cards look identical in padding/radius/font?
*   [ ] **Code Quality:** Are there zero `statusConfig` objects defined inside page components?
*   [ ] **No Overrides:** Are we avoiding `className="bg-primary-500..."` overrides on Buttons? (They should use `variant` props only).
*   [ ] **Type Safety:** Are the new components strictly typed?

good luck.
