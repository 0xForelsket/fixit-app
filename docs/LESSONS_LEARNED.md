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

### The Insight
Drizzle ORM's query builder is ergonomic but dangerous. It makes loop-based fetching look cleaner than it is performant.

### The Fix
We shifted from:
```ts
// Bad: 1 query + N queries
const orders = await getOrders();
for (const o of orders) { o.tech = await getTech(o.techId); }
```
To two optimized patterns:
1.  **Single Query Joins:** Using `db.select().from().innerJoin()` for read-heavy views.
2.  **Batch Filling:** Using `Promise.all` + `inArray` checks for situations where joins were too complex.

---

## 3. The Testing Migration: Vitest to Bun Native

### The Event
The team moved from proper Vitest/Jest setups to Bun's native test runner (`bun:test`).

### The Friction
While unit tests for logic functions were trivial to migrate, **React Component tests failed effectively everywhere**.
*   **Root Cause:** Bun's module loader is faster than Testing Library's expectation of DOM availability. `import { screen }` would crash before `happy-dom` could register.
*   **The "Glue" Code:** We had to invent a `dom-setup.ts` pattern to force order-of-operations.

### The Lesson
**Bleeding edge speeds have bleeding edge sharp corners.** Bun is incredibly fast, but its ecosystem compatibility (especially with deeply entrenched tools like `testing-library` + `jest-dom`) often requires custom shims that aren't documented in the official "Migration" guides.

---

## 4. UI Architecture: The "God Component" Trap

### The Event
The `Sidebar` component grew to >700 lines (`1021069`), managing navigation state, user menus, organization switching, and mobile responsiveness.

### The Refactor
We split it into 5 focused sub-modules (`sidebar-nav.tsx`, `sidebar-user.tsx`, etc.).

### The Lesson
**"Files" are not "Features".** We initially kept everything in "Sidebar.tsx" because it was "The Sidebar". breaking it down by *responsibility* (navigation vs. user context vs. layout) made the code testable and readable.

---

## 5. DevOps & Tooling Improvements

### Bun Shell for Cross-Platform scripts
Replacing standard Bash scripts (`tunnel.sh`) with TypeScript scripts using Bun Shell (`$`) solved recurring Windows/WSL interoperability headaches. It allowed us to write complex retry logic and environment variable injection in the same language as the app.

### Dynamic Imports for "Heavy" Features
We reduced the initial bundle size by implementing `next/dynamic` for specific heavy dependencies:
*   `@react-pdf/renderer` (Reporting)
*   `html5-qrcode` (Scanner)
*   `recharts` (Analytics)

These libraries are now only loaded when the user actually navigates to those specific routes, significantly improving First Contentful Paint (FCP).

---

## Summary Recommendation
For the next iteration or project:
1.  **Schema First:** Use UUIDv7 from the start.
2.  **Performance First:** Profile bundle size and SQL query counts *before* feature complete.
3.  **Testing Strategy:** If using Bun, establish the DOM environment pattern immediately, rather than porting it later.
4.  **Component sizing:** Enforce specific file-size limits (e.g., ~200 lines) to force early component composition.

*Generated: January 2, 2026*
