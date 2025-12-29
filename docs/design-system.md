# FixIt Design System

This document provides comprehensive documentation for the FixIt CMMS design system, including design tokens, color usage guidelines, spacing scales, and component patterns.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing Scale](#spacing-scale)
5. [Shadows & Elevation](#shadows--elevation)
6. [Status Indicators](#status-indicators)
7. [Component Patterns](#component-patterns)
8. [Animation Guidelines](#animation-guidelines)
9. [Accessibility](#accessibility)

---

## Design Philosophy

FixIt follows an **Industrial Digital Design** philosophy, inspired by:

- **Control room interfaces** - High information density, clear status indicators
- **Engineering blueprints** - Grid-based layouts, monospace data
- **Safety-critical systems** - High contrast, clear visual hierarchy

### Core Principles

1. **Clarity over decoration** - Every element serves a purpose
2. **Status at a glance** - Use color and shape to convey state
3. **Mobile-first, desktop-enhanced** - Workers use tablets and phones on the floor
4. **High contrast** - Readable in various lighting conditions

---

## Color System

### Primary Palette: Industrial Orange

The primary color represents action, CTAs, and brand identity.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#fff7ed` | Backgrounds, subtle highlights |
| `primary-100` | `#ffedd5` | Hover states on light backgrounds |
| `primary-200` | `#fed7aa` | Focus rings, borders |
| `primary-300` | `#fdba74` | Light accents |
| `primary-400` | `#fb923c` | Dark mode primary |
| `primary-500` | `#f97316` | **Default primary** - Buttons, links |
| `primary-600` | `#ea580c` | Hover on primary buttons |
| `primary-700` | `#c2410c` | Active/pressed states |
| `primary-800` | `#9a3412` | Dark text on orange backgrounds |
| `primary-900` | `#7c2d12` | Darkest shade |
| `primary-950` | `#431407` | Text on primary backgrounds |

**Usage Guidelines:**
- Use `primary-500` for primary action buttons
- Use `primary-600` for hover states
- Use `primary-50` for subtle background highlights on active items
- Never use more than 3 shades of primary on a single screen

### Secondary Palette: Steel Blue

The secondary color represents information, links, and secondary actions.

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-50` | `#f0f9ff` | Information backgrounds |
| `secondary-500` | `#0ea5e9` | Links, info badges |
| `secondary-600` | `#0284c7` | Hover states |
| `secondary-700` | `#0369a1` | Active states |

### Semantic Colors

#### Success (Green)
```css
--color-success-500: #22c55e;
--color-success-600: #16a34a;
```
**Use for:** Completed tasks, operational status, positive confirmations

#### Warning (Amber)
```css
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
```
**Use for:** Pending actions, maintenance status, cautions

#### Danger (Red)
```css
--color-danger-500: #ef4444;
--color-danger-600: #dc2626;
```
**Use for:** Critical alerts, errors, equipment down, destructive actions

#### Info (Purple)
```css
--color-info-500: #8b5cf6;
--color-info-600: #7c3aed;
```
**Use for:** In-progress status, informational messages

### Neutral Colors

The app uses Tailwind's Zinc scale for neutral colors:

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `background` | `#fafafa` | `#09090b` | Page backgrounds |
| `foreground` | `#18181b` | `#fafafa` | Primary text |
| `muted` | `#f4f4f5` | `#27272a` | Subtle backgrounds |
| `muted-foreground` | `#71717a` | `#a1a1aa` | Secondary text |
| `border` | `#e4e4e7` | `#3f3f46` | Borders, dividers |

---

## Typography

### Font Families

```css
--font-sans: "Outfit", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

**Outfit** - Used for headings, body text, UI labels
**JetBrains Mono** - Used for equipment IDs, codes, data values

### Type Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-5xl font-black` | 48px | 900 | Page titles |
| `text-3xl font-bold` | 30px | 700 | Section headings |
| `text-2xl font-semibold` | 24px | 600 | Card titles |
| `text-xl font-semibold` | 20px | 600 | Sub-section titles |
| `text-base` | 16px | 400 | Body text |
| `text-sm` | 14px | 400 | Secondary text, metadata |
| `text-xs` | 12px | 400 | Captions, timestamps |

### Tracking (Letter Spacing)

- `tracking-tight` (-0.025em) - Headings
- `tracking-normal` (0) - Body text
- `tracking-wide` (0.025em) - Labels, badges

---

## Spacing Scale

FixIt uses Tailwind's default spacing scale based on 4px increments:

| Token | Value | Common Usage |
|-------|-------|--------------|
| `0` | 0px | Reset |
| `0.5` | 2px | Tight gaps |
| `1` | 4px | Inline spacing |
| `1.5` | 6px | Compact padding |
| `2` | 8px | **Standard gap** - Between related items |
| `3` | 12px | Small padding |
| `4` | 16px | **Comfortable gap** - Card padding |
| `5` | 20px | Section breaks |
| `6` | 24px | **Standard padding** - Containers |
| `8` | 32px | Large sections |
| `10` | 40px | Page margins (mobile) |
| `12` | 48px | Page margins (desktop) |

### Spacing Guidelines

1. **Consistent gaps:** Use `gap-2` (8px) for tight groups, `gap-4` (16px) for related items
2. **Card padding:** Use `p-4` (16px) for cards, `p-6` (24px) for larger containers
3. **Section spacing:** Use `space-y-6` (24px) between major sections
4. **Page padding:** Use `px-4 sm:px-6 lg:px-8` for responsive page margins

---

## Shadows & Elevation

### Shadow Scale

```css
/* Subtle - cards, containers */
.card-shadow {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.08);
}

/* Medium - dropdowns, modals */
.card-shadow-md {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.08);
}

/* Large - popovers, tooltips */
.card-shadow-lg {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08);
}
```

### Industrial Glass Card

For premium card appearance with blur effect:

```css
.card-industrial {
  background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
  backdrop-filter: blur(8px);
}
```

---

## Status Indicators

### Status Dot Pattern

Used for equipment and work order status:

```html
<span class="status-dot status-operational"></span>
<span class="status-dot status-maintenance"></span>
<span class="status-dot status-down"></span>
<span class="status-dot status-in-progress"></span>
```

| Status | Class | Color | Animation |
|--------|-------|-------|-----------|
| Operational | `status-operational` | Green | None |
| Maintenance | `status-maintenance` | Amber | None |
| Down | `status-down` | Red | Pulse |
| In Progress | `status-in-progress` | Purple | None |

### Priority Badges

```css
.priority-critical   /* Red gradient, pulsing shadow */
.priority-high       /* Orange gradient */
.priority-medium     /* Amber gradient */
.priority-low        /* Green gradient */
```

---

## Component Patterns

### Stats Cards

Use the `<StatsCard>` component for dashboard metrics:

```tsx
<StatsCard
  title="Open Work Orders"
  value={42}
  icon={Inbox}
  variant="primary"    // default, primary, warning, danger, success
  trend={{ value: 12, positive: true }}
/>
```

### Status Badges

Use `<StatusBadge>` for consistent status display:

```tsx
<StatusBadge status="open" />
<StatusBadge status="in_progress" />
<StatusBadge status="resolved" />
<StatusBadge status="operational" />
<StatusBadge status="down" />
```

### Empty States

Always use `<EmptyState>` when lists are empty:

```tsx
<EmptyState
  icon={Package}
  title="No spare parts"
  description="Add your first spare part to get started."
  action={{
    label: "Add Part",
    href: "/inventory/parts/new"
  }}
/>
```

---

## Animation Guidelines

### Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade in | 400ms | ease-out |
| Slide in | 500ms | ease-out |
| Hover lift | 200ms | ease |
| Color change | 150ms | ease |

### Staggered Animations

For lists, use staggered animation delays:

```tsx
<div className="animate-stagger-1 animate-in">Item 1</div>
<div className="animate-stagger-2 animate-in">Item 2</div>
<div className="animate-stagger-3 animate-in">Item 3</div>
```

### Interactive States

```css
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: /* elevated shadow */;
}

.hover-accent:hover {
  border-color: var(--color-primary-400);
}
```

---

## Accessibility

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- **Normal text:** 4.5:1 contrast ratio minimum
- **Large text (18px+ or 14px+ bold):** 3:1 minimum

### Focus Indicators

Use the `.focus-ring` class for custom focus states:

```css
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--color-primary-500);
}
```

### Reduced Motion

Animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-in,
  .animate-slide-in {
    animation: none;
  }
}
```

---

## CSS Variables Reference

### Quick Reference

```css
/* Colors */
--color-primary-500: #f97316;
--color-secondary-500: #0ea5e9;
--color-success-500: #22c55e;
--color-warning-500: #f59e0b;
--color-danger-500: #ef4444;
--color-info-500: #8b5cf6;

/* Semantic */
--background: #fafafa;
--foreground: #18181b;
--muted: #f4f4f5;
--muted-foreground: #71717a;
--border: #e4e4e7;

/* Typography */
--font-sans: "Outfit", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;

/* Sizing */
--radius: 0.5rem;
```

---

## Live Examples

Visit `/design-system` in the application to see live, interactive examples of all components.
