# N+1 Query Audit Report

**Audit Date:** 2026-01-02  
**Status:** ✅ Critical Issues Resolved

This document tracks identified N+1 query patterns and their resolutions across the FixIt CMMS codebase.

---

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| ✅ **Fixed** | 4 | Queries inside loops converted to batch operations |
| � **Low Priority** | 1 | Presigned URL generation (requires architecture change) |
| 🟢 **Good** | 12+ | Already using `.with()`, `inArray()`, or batch patterns |

---

## ✅ Fixes Completed (2026-01-02)

### 1. `src/actions/users.ts` - `updateUserAvatar()` ✅

**Before:** Sequential delete operations in a `for` loop (N+1 pattern).

**After:** Batch delete with `inArray()` + parallel S3 deletes with `Promise.allSettled()`.

```typescript
// Single batch delete from DB
await db.delete(attachments).where(inArray(attachments.id, oldAvatarIds));
// Parallel S3 deletes
await Promise.allSettled(oldAvatars.map(a => deleteObject(a.s3Key)));
```

---

### 2. `src/actions/users.ts` - `createUser()` ✅

**Before:** 3 sequential validation queries (employeeId check, email check, role check).

**After:** Parallel validation with `Promise.all()`.

```typescript
const [existingByEmployeeId, existingByEmail, role] = await Promise.all([
  db.query.users.findFirst({ where: eq(users.employeeId, parsed.data.employeeId) }),
  parsed.data.email ? db.query.users.findFirst({...}) : Promise.resolve(null),
  parsed.data.roleId ? db.query.roles.findFirst({...}) : Promise.resolve(null),
]);
```

---

### 3. `src/app/(app)/maintenance/work-orders/page.tsx` - `getTechnicians()` ✅

**Before:** Two-step query (find role by name, then find users with that role).

**After:** Single query using `innerJoin`.

```typescript
const techs = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .innerJoin(roles, eq(users.roleId, roles.id))
  .where(and(eq(roles.name, "tech"), eq(users.isActive, true)));
```

---

### 4. `src/actions/departments.ts` - `getDepartmentWithDetails()` ✅

**Before:** ~9 sequential database queries.

**After:** 3 parallelized phases:
- **Phase 1:** Members + Manager fetched in parallel
- **Phase 2:** Member avatars, WO counts, equipment, work orders, manager avatar all fetched in parallel
- **Phase 3:** Assignee names (depends on work orders data)

**Result:** Reduced from sequential round-trips to 3 parallel batches.

---

## 🔵 Low Priority (Deferred)

### Presigned URL Generation

**Files affected:**
- `src/actions/attachments.ts` - `getAllAttachments()`
- `src/app/(app)/maintenance/work-orders/[displayId]/page.tsx`

**Pattern:** Presigned URL generation in async map (parallelized with `Promise.all`, but each is a separate AWS request).

```typescript
const dataWithUrls = await Promise.all(
  data.map(async (file) => ({
    ...file,
    url: await getPresignedDownloadUrl(file.s3Key),
  }))
);
```

**Analysis:** Using `Promise.all()` parallelizes calls, but there's no way to batch S3 `getSignedUrl()`.

**Potential Fix Options:**
1. **Lazy URL generation:** Generate URLs on-demand when user clicks to view/download
2. **Caching:** Cache presigned URLs briefly (they typically have 15-60 min TTLs)
3. **Pagination:** Limit attachments per page

**Decision:** Deferred - Most entities have few attachments. Impact is minimal.

---

## 🟢 Already Optimized (Good Patterns)

The codebase follows many best practices out of the box:

### Batch Fetching with `inArray()`
- ✅ `getAllAttachments()` - Batch fetches work order and equipment names
- ✅ `getDepartments()` - Batch fetches manager names
- ✅ `getDepartmentsWithStats()` - Batch fetches manager info and avatars
- ✅ `getDepartmentWithDetails()` - Batch fetches member avatars and work order counts
- ✅ `bulkUpdateWorkOrders()` - Batch fetches existing work orders before update
- ✅ `createNotificationsForUsers()` - Batch fetches user preferences

### Drizzle `.with()` Relations
- ✅ Work order detail page - Uses nested `.with()` for equipment, location, logs, etc.
- ✅ Work order list - Uses `.with()` for equipment, location, reportedBy, assignedTo
- ✅ `getUsers()` - Fetches `assignedRole` relation

### Transaction Batching
- ✅ `bulkUpdateWorkOrders()` - Uses `db.transaction()` with batch inserts
- ✅ `importPartsFromCSV()` - Prefetches all locations and existing SKUs, batch inserts

### Parallel Execution
- ✅ Work order detail page - `Promise.all()` for 8 parallel data fetches
- ✅ Work order list page - `Promise.all()` for getWorkOrders, getStats, getTechnicians
- ✅ Global search API - `Promise.all()` for work orders, equipment, parts searches
- ✅ `getDepartmentWithDetails()` - Now uses 3 parallelized phases

---

## Notes

- **Presigned URLs are inherently expensive** - There's no way to batch S3 `getSignedUrl()` calls. Consider generating them on-demand at the component level for future optimization.
- **Most listing pages are well-optimized** - The work order list, equipment list, etc. already use `.with()` relations efficiently.
- **The bulk operations are excellent** - `bulkUpdateWorkOrders`, `importPartsFromCSV`, and `createNotificationsForUsers` all follow batch patterns.

---

*Last Updated: 2026-01-02*
