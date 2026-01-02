# Lessons Learned: The FixIt CMMS Project

This document captures the key technical insights, challenges, and solutions encountered during the development and evolution of the FixIt CMMS project. It serves as a knowledge base for future maintenance and similar projects.

## 1. The Bun Migration: Promise vs. Reality

Moving to Bun provided significant performance benefits but came with specific compatibility hurdles, particularly in testing and ecosystem tools.

### Testing with `happy-dom` & Native Runner
**The Challenge:** We faced persistent "Global document must be available" errors when migrating component tests.
**The Insight:** Bun loads modules *fast*—so fast that it parses `@testing-library/react` imports (which check for `document.body` immediately) before the `preload` script has a chance to register `happy-dom`.
**The Solution:**
- **Avoid Global `screen`:** We shifted from `import { screen }` to destructuring `const { getByText } = render(...)` inside the test function, ensuring the DOM is ready at execution time.
- **`dom-setup.ts`:** Created a dedicated wrapper that registers `happy-dom` *before* re-exporting testing libraries for cases where globals are unavoidable.
- **Native Mocks:** We replaced Vitest's `vi.fn()` with Bun's native `mock()`, which required updating all mock implementations to match the slightly different API.

### Scripting with Bun Shell
**The Win:** Replacing various bash scripts (`tunnel.sh`, etc.) with TypeScript scripts using Bun Shell (`$`) eliminated cross-platform compatibility issues (Windows vs. Linux/WSL) and allowed us to use our existing project types and logic within ops scripts.

## 2. Next.js in a Bun World

### Production Build Quirks
**The Challenge:** Running `bun run start` (executing `next start`) resulted in opaque internal errors (`routesManifest.dataRoutes is not iterable`).
**The Root Cause:** This often stems from subtle incompatibilities in how Bun's runtime emulates Node.js internals required by Next.js's server handling.
**The Fix:** We had to carefully align dependency versions and ensuring strict adherence to Next.js build output structures.

### Networking & Tunnels in WSL
**The Challenge:** Exposing the local dev server from WSL2 to the outside world (for mobile testing/webhooks) was fragile. Cloudflare's `untun` frequently failed due to strict network policies or DNS rebinding protections.
**The Solution:** We built a robust custom tunnel script (`scripts/tunnel.ts`) that:
1.  Falls back between multiple providers (`serveo`, `pinggy`, `localhost.run`).
2.  Handles SSH reconnection logic automatically.
3.  Injects the tunnel URL directly into the middleware via environment files to ensure authentication flows work correctly on the proxied domain.

## 3. Database & Architecture

### The Pivot to UUIDv7 & Postgres
**The Shift:** We moved from numeric auto-increment IDs (SQLite style) to UUIDv7.
**Why:**
- **Sortable by time:** UUIDv7 retains the time-ordered nature of auto-increment IDs (crucial for "latest work orders") without the contention or predictability of integers.
- **Client-side generation:** Allows us to generate IDs on the client before saving, simplifying optimistic UI updates.
- **Mergeability:** Makes future data synchronization or merging from offline PWAs significantly easier than integer IDs.

### Drizzle ORM Performance
**The Lesson:** Drizzle is fast, but its "query builder" syntax can easily hide N+1 problems.
**The Fix:** We conducted a strict N+1 audit (detailed in `docs/N+1_QUERY_AUDIT.md`) and refactored loops of queries into efficient `Promise.all` batches or single SQL `JOIN`s / `inArray` clauses.

## 4. Code Quality Discipline

### Atomic Commits
**The Practice:** We enforced a strict discipline of "Atomic Commits"—grouping changes by logical unit rather than time.
**The Benefit:** This made reverting specific regression (like the Sidebar refactor breakage) trivial without undoing unrelated work on the API that happened around the same time.

### Component Composition
**The Refactor:** The Sidebar grew to 700+ lines. Breaking it down (`sidebar-nav.tsx`, `sidebar-user.tsx`, etc.) proved that "Files" are a poor unit of organization; "Features" are better.
**The Lesson:** If a component requires scrolling to understand its state logic *and* its render logic, it's already too big.

## 5. Tooling & Dependencies

### "Lightweight" Alternatives
- **Bcrypt → Bun.password:** Replaced the heavy JS `bcrypt` implementation with Bun's native, optimized native code password hashing.
- **QR Codes:** Replaced the heavy `qrcode.react` wrapper with a 15-line custom component wrapping the core `qrcode` library, saving bundle size.

---
*Generated: January 2026*
