# FixIt CMMS - Performance & Optimization Roadmap

This document tracks the completed and planned optimizations to make the FixIt CMMS lighter, faster, and more efficient by leveraging Bun, Next.js, and modern web standards.

---

## 📊 Completed Optimizations (Phase 1)

### 1. Dependency Trimming
- **Removed `jsdom`**: Switched entirely to `happy-dom` for testing, reducing install size by ~25MB.
- **Native Bun Shell**: Converted `.sh` scripts to `.ts` using Bun Shell (`$`) for consistent cross-platform execution.
- **Environment Isolation**: Moved development-only tools like `pino-pretty` to `devDependencies` to keep production builds lean.
- **Replaced `qrcode.react`**: Created a custom lightweight `QRCode` component using the core `qrcode` library to reduce external dependencies.

### 2. Code Splitting & Lazy Loading
- **Dynamic PDF/Scanner**: Implemented dynamic imports for `@react-pdf/renderer` and `html5-qrcode`. These heavy modules (up to 2MB) are now only loaded when the user interacts with those specific features.
- **Analytics Isolation**: All `recharts` components are lazily loaded, ensuring the main dashboard remains fast.

### 3. N+1 Query Optimization ✅
Performed a comprehensive Drizzle ORM audit. See [`docs/N+1_QUERY_AUDIT.md`](docs/N+1_QUERY_AUDIT.md) for full details.

**Fixes implemented:**
- **`updateUserAvatar()`**: Replaced loop delete with batch `inArray()` delete + parallel S3 cleanup.
- **`createUser()`**: Parallelized 3 sequential validation queries with `Promise.all()`.
- **`getTechnicians()`**: Replaced 2-step query with single `innerJoin` query.
- **`getDepartmentWithDetails()`**: Restructured ~9 sequential queries into 3 parallelized phases.

### 4. Payload Compression ✅ (NEW)
Audited API responses to ensure only required fields are sent. See [`docs/PAYLOAD_AUDIT.md`](docs/PAYLOAD_AUDIT.md) for full details.

**Fixes implemented (6 endpoints):**
- **`/api/labor`**: Limited user and workOrder relations to display fields only.
- **`/api/equipment/[id]`**: Added column selection for owner, location, parent, children.
- **`/api/work-orders` POST**: Replaced full user fetch with optimized tech-only JOIN query.
- **`/api/work-orders` GET**: Added equipment column selection.
- **`/api/equipment` GET**: Added location column selection.
- **`/api/inventory/parts`**: Added pagination (limit 100) and column selection.

**Estimated savings:** 50-75% reduction in API response payload sizes.

---

## 🚀 Future Roadmap (Discussion Phase)

### 5. Radical UI Optimization
- **CSS over JS Animations**: Replace basic `framer-motion` effects (fades, slides) with raw CSS transitions. This reduces the Javascript main-thread execution cost for UI interactions.
- **Inline SVG Icons**: Convert critical-path icons (Sidebar, Header) from `lucide-react` to optimized inline SVGs. This eliminates the library overhead for the initial paint.

### 6. Server-Side Execution
- **`next/after()` Implementation**: (Next.js 15+) Shift non-blocking tasks like logging, analytics, and non-critical notifications to an `after()` block. This allows the API to return a response to the user immediately while finishing the "quiet" work in the background.
- **Edge Runtime Audit**: Move high-traffic, read-heavy API routes to the Edge runtime for near-zero latency globally.

### 7. Data Access Layer (Remaining)
- **Lazy Presigned URLs**: Consider generating S3 presigned URLs on-demand at the client level rather than server-side batch generation.

### 8. Component Architecture
- **Mega-Component Refactoring**: Break down complex components (like the current 714-line `sidebar.tsx`) into smaller, focused modules. This improves React's hydration speed and makes the code more maintainable.

### 9. Modern Charting
- **Recharts Alternatives**: Evaluate switching from the generic `recharts` to a more modular library like `visx` or writing custom SVG components for high-frequency charts.

---
*Last Updated: 2026-01-02*
