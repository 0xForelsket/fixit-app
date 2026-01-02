# Payload Compression Audit

**Audit Date:** 2026-01-02  
**Status:** ✅ High Priority Issues Resolved

This document tracks API response payload optimization opportunities.

---

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| ✅ **Fixed** | 6 | Relations now use column selection, optimized queries |
| 🟡 **Remaining** | 2 | Notification & work order detail page could be further optimized |
| 🟢 **Good** | 10+ | Already using `columns:` to limit fields |

---

## ✅ Fixes Completed (2026-01-02)

### 1. `/api/labor` GET ✅

**Before:** Fetched ALL columns from user (including pin, sessionVersion) and workOrder.

**After:** Limited to `{ id, name, employeeId }` for user and `{ id, displayId, title, status }` for workOrder.

---

### 2. `/api/equipment/[id]` GET ✅

**Before:** Fetched full owner, location, parent, and children objects.

**After:** All relations now use column selection - only fetch needed display fields.

---

### 3. `/api/work-orders` POST ✅

**Before:** Fetched ALL active users with full data, then filtered for technicians in JS.

**After:** Single optimized query with innerJoin to get only tech user IDs directly.

---

### 4. `/api/work-orders` GET ✅

**Before:** Fetched full equipment object for each work order.

**After:** Limited equipment to `{ id, name, code, status }`.

---

### 5. `/api/equipment` GET ✅

**Before:** Fetched full location object.

**After:** Limited location to `{ id, name, code }`.

---

### 6. `/api/inventory/parts` GET ✅

**Before:** No pagination, returned all columns for all parts.

**After:** Added limit of 100, selected only list-display columns (id, displayId, name, sku, barcode, category, unitCost, reorderPoint, isActive).

---

## 🟡 Remaining (Low Priority)

### 7. `/api/notifications` GET - Returns full notification objects

**File:** `src/app/(app)/api/notifications/route.ts`  
**Lines:** 18-22

The notification table is okay (no sensitive data), but could still be trimmed:

```typescript
// Could add columns if we don't need all fields:
columns: {
  id: true,
  type: true,
  title: true,
  message: true,
  link: true,
  isRead: true,
  createdAt: true,
  // userId is implicit - not needed in response
}
```

---

### 8. Work Order Detail Page - `allUsers` fetch

**File:** `src/app/(app)/maintenance/work-orders/[displayId]/page.tsx`  
**Lines:** 119-123

```typescript
// CURRENT: Fetches ALL users
allUsers = db.query.users.findMany({
  with: { assignedRole: true },
})
```

**Used for:** Filtering technicians for assignment dropdown.

**Fix:** Query only active technicians directly.

---

## 🟢 Already Optimized

These endpoints already use proper column selection:

| Endpoint | Status |
|----------|--------|
| `/api/search/global` | ✅ Uses `columns:` for WO, equipment, parts |
| `/api/analytics/technicians` | ✅ Uses `select()` with specific fields |
| `/api/analytics/kpis` | ✅ Raw SQL with only needed aggregates |
| `/api/auth/me` | ✅ Returns minimal user data |
| Work Orders List Page | ✅ Uses `with: { reportedBy: { columns: ... } }` |
| Equipment List Page | ✅ Uses `columns:` extensively |

---

## Estimated Payload Size Reductions

| Endpoint | Before (est.) | After (est.) | Savings |
|----------|---------------|--------------|---------|
| `/api/labor` | ~2KB/log | ~500B/log | 75% |
| `/api/equipment/[id]` | ~3KB | ~1.5KB | 50% |
| `/api/work-orders` | ~2KB/order | ~1KB/order | 50% |
| `/api/inventory/parts` | ~1KB/part | ~400B/part | 60% |

---

*Last Updated: 2026-01-02*
