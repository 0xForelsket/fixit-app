# FixIt CMMS - Improvement Plan

> **Generated:** December 28, 2025  
> **Overall Score:** 7.5/10 - Solid foundation with technical debt to address  
> **Status:** 🔴 Build failing due to test type errors

---

## Quick Reference

| Area | Score | Status |
|------|-------|--------|
| Architecture | 8.5/10 | ✅ Good |
| Code Quality | 7/10 | ⚠️ Type issues |
| Security | 8/10 | ✅ Good foundation |
| Testing | 6/10 | 🔴 Tests broken |
| UX/Design | 8.5/10 | ✅ Polished |
| DX | 7.5/10 | ⚠️ CI blocked |

---

## 🔴 Priority 1: Critical (Fix Immediately)

### 1.1 Broken TypeScript Build - Tests Out of Sync

**Status:** ✅ Complete (Dec 28, 2025)  
**Severity:** CRITICAL | **Effort:** 2-3 hours  
**Blocking:** CI/CD, new development

The `bun run build:check` fails with **42+ TypeScript errors** in test files.

#### Root Causes:
1. Tests reference deleted functions (`canAccess`, `hasRole` from `@/lib/auth`)
2. Tests reference renamed schemas (`createTicketSchema`, `updateTicketSchema`)
3. Tests use old `SessionUser` shape (`role` instead of `roleName`, missing `permissions`)
4. Tests pass wrong `ActionResult` arguments (`{}` instead of `undefined`)

#### Affected Files:
| File | Errors | Issue |
|------|--------|-------|
| `src/tests/unit/auth.test.ts` | 2 | References removed `canAccess`, `hasRole` |
| `src/tests/unit/validations.test.ts` | 2 | References removed ticket schemas |
| `src/tests/unit/actions/workOrders.test.ts` | 35+ | `SessionUser` shape, `ActionResult` usage |
| `src/tests/unit/api/workOrders.test.ts` | 1 | `SessionUser` shape |

#### Tasks:
- [ ] **1.1.1** Delete or update `src/tests/unit/auth.test.ts` - remove tests for `canAccess`, `hasRole`
- [ ] **1.1.2** Update `src/tests/unit/validations.test.ts` - fix/remove ticket schema tests
- [ ] **1.1.3** Update `src/tests/unit/actions/workOrders.test.ts`:
  - [ ] Change `role` to `roleName` in all `SessionUser` mocks
  - [ ] Add `permissions` array to all `SessionUser` mocks
  - [ ] Change `{}` to `undefined` for `ActionResult` initial state
  - [ ] Fix `.error` access to check `!result.success` first
- [ ] **1.1.4** Update `src/tests/unit/api/workOrders.test.ts` - same `SessionUser` fixes
- [ ] **1.1.5** Run `bun run build:check` - verify 0 errors

#### Correct SessionUser Shape:
```typescript
{
  id: 1,
  employeeId: "TECH-001",
  name: "Test User",
  roleName: "tech",           // NOT 'role'
  roleId: 2,                  // optional
  permissions: ["ticket:create", "ticket:view"],  // REQUIRED
  hourlyRate: null            // optional
}
```

#### Correct ActionResult Usage:
```typescript
// ❌ Wrong
const result = await createWorkOrder({}, formData);  
if (result.error) { ... }

// ✅ Correct  
const result = await createWorkOrder(undefined, formData);
if (!result.success) {
  console.log(result.error);  // Now TypeScript knows error exists
}
```

---

### 1.2 Linting Errors in E2E Tests

**Status:** ✅ Complete (Dec 28, 2025)  
**Severity:** HIGH | **Effort:** 10 minutes

E2E tests have formatting and import ordering issues.

#### Tasks:
- [ ] **1.2.1** Run `bun run lint:fix`
- [ ] **1.2.2** Verify no remaining errors with `bun run lint`

---

## 🟠 Priority 2: High (This Week)

### 2.1 Unsafe Type Assertions

**Status:** ⬜ Not Started  
**Severity:** HIGH | **Effort:** 1 hour

Several places use `as unknown as` to bypass TypeScript, masking potential bugs.

#### Affected Files:
| File | Line | Issue |
|------|------|-------|
| `src/app/(main)/dashboard/page.tsx` | 249 | `as unknown as WorkOrderWithRelations[]` |
| `src/app/(main)/dashboard/page.tsx` | 320 | `as unknown as WorkOrderWithRelations[]` |

#### Tasks:
- [ ] **2.1.1** Create proper type inference from `db.query.workOrders.findMany()` result
- [ ] **2.1.2** Update `WorkOrderWithRelations` type to match actual query output
- [ ] **2.1.3** Remove `as unknown as` assertions

---

### 2.2 Dashboard Query Performance

**Status:** ⬜ Not Started  
**Severity:** MEDIUM-HIGH | **Effort:** 2-3 hours

The dashboard makes **8 separate database queries** that could be consolidated.

#### Current State:
```typescript
// 8 queries in getStats():
const globalOpen = await db.select({...}).where(eq(status, "open"));
const globalInProgress = await db.select({...}).where(eq(status, "in_progress"));
const globalOverdue = await db.select({...});
const globalCritical = await db.select({...});
const myOpen = await db.select({...});
const myInProgress = await db.select({...});
const myOverdue = await db.select({...});
const myCritical = await db.select({...});
```

#### Tasks:
- [ ] **2.2.1** Create a single aggregated query with CASE/WHEN or subqueries
- [ ] **2.2.2** Consider creating a stats service (`src/lib/services/stats.ts`)
- [ ] **2.2.3** Benchmark before/after query times

---

### 2.3 Verify Rate Limiting Coverage

**Status:** ⬜ Not Started  
**Severity:** HIGH | **Effort:** 2 hours

Rate limiting utility exists but needs verification of application.

#### Tasks:
- [ ] **2.3.1** Verify `/api/auth/login` uses rate limiting
- [ ] **2.3.2** Add rate limiting to `/api/attachments` (file upload abuse)
- [ ] **2.3.3** Add rate limiting to `/api/work-orders` POST
- [ ] **2.3.4** Add rate limiting to `/api/equipment` POST
- [ ] **2.3.5** Document rate limits in `AGENTS.md`

---

## 🟡 Priority 3: Medium (This Sprint)

### 3.1 Add Route-Group Error Boundaries

**Status:** ⬜ Not Started  
**Severity:** MEDIUM | **Effort:** 1 hour

Only root `error.tsx` exists. Route groups need their own.

#### Tasks:
- [ ] **3.1.1** Create `src/app/(main)/error.tsx`
- [ ] **3.1.2** Create `src/app/(operator)/error.tsx`
- [ ] **3.1.3** Create `src/app/(auth)/error.tsx`
- [ ] **3.1.4** Test error boundaries catch component crashes

---

### 3.2 Split Large Components

**Status:** ⬜ Not Started  
**Severity:** MEDIUM | **Effort:** 3-4 hours

Several components exceed 300 lines.

#### Candidates:
| File | Lines | Action |
|------|-------|--------|
| `src/components/ui/camera-capture.tsx` | ~300 | Extract hooks, split UI |
| `src/components/ui/file-upload.tsx` | ~200 | Extract validation logic |

#### Tasks:
- [ ] **3.2.1** Extract `useCameraCapture` hook from camera-capture.tsx
- [ ] **3.2.2** Extract `useFileUpload` hook from file-upload.tsx
- [ ] **3.2.3** Verify no regression in functionality

---

### 3.3 Accessibility Audit

**Status:** ⬜ Not Started  
**Severity:** MEDIUM | **Effort:** 2-3 hours

#### Tasks:
- [ ] **3.3.1** Add skip-to-content links in main layout
- [ ] **3.3.2** Verify focus trap in Dialog component (Radix should handle)
- [ ] **3.3.3** Check color contrast ratios for status badges
- [ ] **3.3.4** Test keyboard navigation through main flows

---

## 🟢 Priority 4: Low (Backlog)

### 4.1 Extract Stats Service
- [ ] Create `src/lib/services/stats.service.ts`
- [ ] Consolidate dashboard stats queries
- [ ] Add caching if needed

### 4.2 Centralize Magic Numbers
- [ ] Create config for pagination limits
- [ ] Document all hardcoded limits

### 4.3 API Documentation
- [ ] Add OpenAPI/Swagger documentation
- [ ] Document all API endpoints in README

### 4.4 Enhance Test Coverage
- [ ] Add integration tests for API routes
- [ ] Maintain E2E tests (14 spec files)
- [ ] Add visual regression tests

### 4.5 PWA Offline Enhancement
- [ ] Implement service worker caching for work order data
- [ ] Add offline queue for ticket submission
- [ ] Show offline indicator in UI

### 4.6 Documentation Updates
- [ ] Update `improvement_plan.md` as items complete
- [ ] Document design system CSS classes
- [ ] Add component storybook (optional)

---

## ✅ Completed Items

_Move items here as they are completed with date._

| Task | Completed | Notes |
|------|-----------|-------|
| **1.1 TypeScript Build Fixes** | Dec 28, 2025 | Fixed all 45+ type errors in tests and components |
| **1.2 Linting Fixes** | Dec 28, 2025 | Fixed formatting in src and e2e files |
| Security headers in next.config.ts | Pre-existing | CSP, X-Frame-Options, etc. |
| Rate limiting utility | Pre-existing | `src/lib/rate-limit.ts` |
| Permission system | Pre-existing | `resource:action` pattern |
| AGENTS.md documentation | Dec 28, 2025 | Updated with current patterns |

---

## 📊 Progress Tracking

### Week of Dec 28, 2025
- [x] Complete Priority 1.1 (TypeScript build)
- [x] Complete Priority 1.2 (Linting)
- [x] Update AGENTS.md documentation
- [x] Update README.md documentation

### Week of Jan 4, 2026
- [ ] Complete Priority 2.1-2.3

### Week of Jan 11, 2026
- [ ] Complete Priority 3.1-3.3

---

## Commands Reference

```bash
# Check for issues
bun run build:check      # TypeScript compilation
bun run lint             # Biome linting
bun run test:run         # Unit tests

# Fix issues
bun run lint:fix         # Auto-fix lint issues

# Development
bun run dev              # Start dev server
bun run db:studio        # Open Drizzle Studio
```

---

## Notes

- All changes should preserve existing code patterns
- Run `bun run lint:fix` before committing
- Run `bun run build:check` to verify TypeScript
- Update this document as items are completed
