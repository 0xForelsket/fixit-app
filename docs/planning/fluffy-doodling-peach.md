# Report Builder Data Visualization Improvements

## Goals
1. **Real stats metrics** - Replace hardcoded values with actual database calculations
2. **Date range filtering** - Add date picker to filter chart/table data by time period
3. **Multi-column resizable grid** - Allow widgets to be positioned and resized on a grid

---

## Phase 1: Real Stats Metrics

**File:** `src/actions/analytics.ts`

Replace hardcoded values in `getStatsSummary()`:

| Metric | Current | Real Calculation |
|--------|---------|------------------|
| Work Orders Completion Rate | 85% | (resolved + closed) / total * 100 |
| Low Stock | 5 | COUNT where quantity <= reorderPoint |
| Total Value | $45k | SUM(quantity * unitCost) |
| Stock Turn | 4.2 | parts used / average inventory |
| Active Techs | 4 | COUNT DISTINCT users with labor logs |
| Avg Cost/Hr | $45 | AVG(hourlyRate) from laborLogs |
| Efficiency | 92% | billable hours / total hours * 100 |

---

## Phase 2: Date Range Filtering

### Type Changes
**File:** `src/components/reports/builder/types.ts`

```typescript
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
  preset?: 'today' | '7d' | '30d' | 'month' | 'quarter' | 'year' | 'custom';
}

// Add to WidgetConfig:
dateRange?: DateRangeFilter;

// Add to ReportConfig:
globalDateRange?: DateRangeFilter;
```

### Analytics Function Updates
**File:** `src/actions/analytics.ts`

- Add `AnalyticsDateRange` interface
- Update all get*Stats functions to accept optional date range
- Apply date filters using `gte()` and `lte()` from drizzle-orm

### New Component
**File:** `src/components/reports/builder/date-range-picker.tsx`

- Preset dropdown (Today, Last 7 days, Last 30 days, etc.)
- Custom date inputs (from/to)
- Reference existing pattern in `src/components/ui/filter-bar.tsx`

---

## Phase 3: Grid Layout

### Approach: Use react-grid-layout library

**Why not build custom with @dnd-kit:**
- Current @dnd-kit only does vertical list sorting
- Building grid would need: custom collision detection, coordinate calculation, resize handles
- react-grid-layout is purpose-built with 12-column grid, drag/drop, resize, responsive breakpoints

### Steps

1. **Install dependencies:**
   ```bash
   bun add react-grid-layout
   bun add -D @types/react-grid-layout
   ```

2. **Create grid wrapper:**
   **File:** `src/components/reports/builder/widget-grid.tsx`
   - Wrap widgets in react-grid-layout
   - Handle layout changes → update widget.layout (x, y, w, h)
   - Configure responsive breakpoints

3. **Update report builder:**
   **File:** `src/components/reports/builder/report-builder.tsx`
   - Remove @dnd-kit (DndContext, SortableContext, useSortable)
   - Import react-grid-layout with dynamic import (SSR: false)
   - Use WidgetGrid component
   - Update addWidget() to place new widgets intelligently

4. **Add CSS:**
   - Import react-grid-layout styles
   - Custom styling for resize handles

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/actions/analytics.ts` | Real metrics, date range params |
| `src/components/reports/builder/types.ts` | DateRangeFilter interface |
| `src/components/reports/builder/report-builder.tsx` | Grid layout, date picker, remove dnd-kit |
| `src/components/reports/builder/date-range-picker.tsx` | **NEW** - Date range component |
| `src/components/reports/builder/widget-grid.tsx` | **NEW** - Grid wrapper |

---

## Implementation Order

1. Real stats metrics (no UI changes, foundation for filtering)
2. Date range types + analytics function updates
3. Date range picker component + integrate into widgets
4. Install react-grid-layout + create widget-grid component
5. Replace dnd-kit with react-grid-layout in report-builder
6. Update tests

---

## Notes

- react-grid-layout needs dynamic import with `{ ssr: false }` (pattern exists in cost-dashboard.tsx)
- WidgetLayout already has x, y, w, h fields - just need to use them
- Date serialization: store as ISO strings in JSON config
