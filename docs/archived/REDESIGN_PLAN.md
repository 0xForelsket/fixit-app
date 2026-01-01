# Operator Dashboard Redesign Plan

## Objective
To align the Operator Dashboard with the **Industrial UI Design System** and significantly improve information density, particularly for mobile users. The goal is to maximize the visibility of critical data (equipment status) while maintaining a sturdy, professional aesthetic.

## 1. Header & Navigation Refactor
**Problem**: The current header and `WelcomeBanner` consume over 30% of the mobile viewport with static profile information.
**Solution**:
- **Remove `WelcomeBanner`**: Eliminate the large black banner completely.
- **Update `UserHeader`**:
  - Integrate specific welcome context into the header if needed, but rely on the existing profile dropdown for user details.
  - Ensure the header remains sticky and compact (h-14 or h-16).
- **Outcome**: Frees up significant vertical space for the equipment list.

## 2. Quick Actions Compression
**Problem**: The "Quick Actions" grid uses large cards with descriptions and colorful icons that compete with the main content.
**Solution**:
- **Design System Alignment**: Use `Button` variants (Ghost or Outline) or a compact "Toolbar" style.
- **Layout**: Change to a single row of compact buttons:
  - `[Report Issue]` (Primary/Danger)
  - `[My Tasks]` (Secondary)
  - `[PM Checks]` (Outline)
- **Removal**: Remove "Equipment" from Quick Actions since the list is immediately below.
- **Visuals**: Use standard Lucide icons without the colored backgrounds.

## 3. Work Order Stats ("Status Summaries")
**Problem**: The `WorkOrderStats` and `PMStats` take up valuable vertical space with large, colorful cards.
**Solution**:
- **Refactor**: Combine these into a scrolling "Ticker" or a compact "Stats Row" using the `StatsCard` component but with `size="sm"` or a custom compact variant.
- **Placement**: Place this *above* the equipment list but ensure it collapses or scrolls horizontally on mobile.

## 4. Equipment List Overhaul (High Priority)
**Problem**: The `EquipmentGrid` displays ~2.5 items per screen due to excessive padding, headers, and footers.
**Solution**: Refactor `EquipmentCard` to be a **Dense List Item**.
- **Container**: Use a simple white `Card` with a thin border. Remove the colored header bar.
- **Layout**:
  - **Row 1**: Equipment Name (Bold, truncated) + Status Badge (Right aligned).
  - **Row 2**: Code (Mono font) + Location (Icon + Text).
- **Typography**:
  - Name: `text-sm font-bold text-zinc-900`
  - Code: `font-mono text-xs text-zinc-500 bg-zinc-100 rounded px-1`
  - Location: `text-xs text-zinc-500`
- **Actions**:
  - Make the entire card clickable to go to details.
  - **Remove** the explicit "Report Issue" footer row.
  - Add a subtle ChevronRight icon to indicate navigability.
- **Status Indication**: Use the `StatusBadge` component which is already compliant with the design system.

## Implementation Steps

### Step 1: Clean Up Layout (`src/app/page.tsx`)
- Remove `<WelcomeBanner />`.
- Wrap `QuickActions`, `WorkOrderStats`, `PMStats` in a container that allows better visual hierarchy.

### Step 2: Refactor Equipment Grid (`src/app/(operator)/equipment-grid.tsx`)
1.  Import `StatusBadge` from `@/components/ui/status-badge`.
2.  Rewrite `EquipmentCard` to remove the colored header div.
3.  Implement the "Dense List Item" layout proposed above.
4.  Verify ~6-8 items are visible on a mobile screen.

### Step 3: Optimize Quick Actions (`src/components/home/quick-actions.tsx`)
1.  Convert the grid of cards to a flex row of standard `Button` components.
2.  Ensure touch targets remain 44px+ for mobile accessibility.

### Step 4: Review & Polish
- Check against the `/design-system` page to ensure font sizes, colors (Zinc-*, Primary-*), and spacing match the tokens.
