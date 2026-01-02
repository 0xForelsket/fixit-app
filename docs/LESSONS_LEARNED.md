# Project Post-Mortem & Lessons Learned

**Project:** FixIt CMMS  
**Timeline:** Dec 2025 - Jan 2026  
**Stack:** Next.js 15, Drizzle ORM, Postgres, Bun

This document analyzes the evolution of the FixIt CMMS codebase, highlighting critical architectural pivots, technical debt payments, and ecosystem challenges. It is intended to guide future engineering decisions.

---

## 1. The Database Pivot: SQLite to Postgres & UUIDv7

### The Event
In late December, the project underwent a massive migration (`e06b975`) from SQLite with integer auto-increment IDs to PostgreSQL with UUIDv7 primary keys.

### Why it happened
*   **Offline Synchronization:** The initial integer ID strategy made client-side generation impossible, hindering PWA "offline-first" capabilities.
*   **Concurrency:** Auto-increment IDs created contention points and predictable resource enumeration risks.

### The Lesson
**Start with UUIDs for sync-heavy apps.** The cost of migrating foreign keys, schema definitions, and mocked data from `number` to `string` (UUID) was high. For any application requiring offline creation or distributed syncing, UUIDs (specifically v7 for time-sorting) should be the default from day one.

---

## 2. Server Data Strategy: The N+1 Discovery

### The Event
As the dashboard grew, performance degraded. A strict audit (`docs/N+1_QUERY_AUDIT.md`) revealed pervasive N+1 query patterns, particularly in "Work Order" lists fetching related "Technicians" and "Equipment".

### The Fix
We shifted from:
```ts
// Bad: 1 query + N queries
const orders = await getOrders();
for (const o of orders) { o.tech = await getTech(o.techId); }
```
To three optimized patterns:
1.  **Single Query Joins:** Using `db.select().from().innerJoin()` for read-heavy views.
2.  **Batch Filling:** Using `Promise.all` + `inArray` checks for situations where joins were too complex.
3.  **Raw SQL Aggregations:** For the KPIs dashboard (`src/app/(app)/api/analytics/kpis/route.ts`), we bypassed the ORM builder entirely to write a single multi-metric SQL query using `FILTER (WHERE ...)` clauses. This reduced 6 separate database calls to 1 round-trip.

### Payload Optimization
We also implemented strict Drizzle column selection (`columns: { i: true, n: true }`) to stop over-fetching sensitive user fields or heavy blobs.

---

## 3. The Testing Migration: Vitest to Bun Native

### The Event
The team moved from mixed Vitest/Jest setups to Bun's native test runner (`bun:test`).

### The Friction
While unit tests for logic functions were trivial to migrate, **React Component tests failed effectively everywhere**.
*   **Root Cause:** Bun's module loader is faster than Testing Library's expectation of DOM availability.
*   **The "Glue" Code:** We had to invent a `dom-setup.ts` pattern to force order-of-operations.

### The Lesson
**Bleeding edge speeds have bleeding edge sharp corners.** Bun is incredibly fast, but its ecosystem compatibility (especially with deeply entrenched tools like `testing-library` + `jest-dom`) often requires custom shims.

---

## 4. PWA & Offline Strategy

### The "NetworkFirst" Choice
For critical data (Work Orders, Equipment), we configured the PWA (`next.config.ts`) to use a `NetworkFirst` strategy with a 10-second timeout.
**Why:** In a manufacturing environment, stale data (like an old machine status) is dangerous. We prioritize fresh data but fall back to the cache only if the connection is truly dead. This is safer than `StaleWhileRevalidate` for operational data.

### Full Text Search without ElasticSearch
Instead of spinning up a separate search service, we utilized **Postgres GIN Indexes** (`src/db/schema.ts`):
```ts
searchIdx: index("wo_search_idx").using("gin", sql`to_tsvector('english', ${table.title} || ' ' || ${table.description})`)
```
This allowed for high-performance, ranked text search directly within the primary database, keeping the infrastructure simple.

---

## 5. Security & Authentication

### Middleware Tunnel Detection
Running the app behind SSH tunnels (Serveo, Pinggy) caused auth redirect loops because the `Host` header didn't match the configured `NEXTAUTH_URL`.
**The Fix:** We updated `src/middleware.ts` to explicitly detect tunnel hostnames (`.trycloudflare.com`, `.pinggy.link`) and treat them as valid "App Contexts", bypassing standard production domain enforcement.

### Brute Force Protection
We implemented natively supported rate-limiting and lockout logic directly in the auth service, avoiding the need for Redis in this scale of deployment.

---

## 6. UI Architecture & Patterns

### The "God Component" Trap
The `Sidebar` component grew to >700 lines. Breaking it down by *responsibility* (navigation vs. user context vs. layout) proved that "Files" are not "Features".

### Form Standardization
We standardized on `src/components/ui/form-layout.tsx` providing `FieldGroup`, `FormGrid`, and `FormSection` primitives to stop UI drift.

### Theme Awareness
We migrated to semantic CSS variables (`bg-card`, `text-foreground`) instead of hardcoded colors, enabling multiple themes (Light/Dark/Industrial) without component logic changes.

---

## Summary Recommendation
For the next iteration or project:
1.  **Schema First:** Use UUIDv7 from the start.
2.  **Raw SQL for Stats:** Don't fear `db.execute(sql\`...\`)` for analytics; ORMs are for entities, SQL is for stats.
3.  **Testing Strategy:** If using Bun, establish the DOM environment pattern immediately.
4.  **Keep Infra Simple:** Use Postgres GIN indexes and PWA caching before reaching for ElasticSearch or Redis.

*Generated: January 2, 2026*
