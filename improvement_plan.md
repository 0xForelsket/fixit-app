# FixIt CMMS - Improvement Plan

> Generated: December 26, 2025
> Overall Codebase Score: **8/10** - Production-ready with recommended enhancements

This document outlines prioritized improvements identified during a comprehensive codebase review covering architecture, code quality, testing, security, and UI/frontend.

---

## Executive Summary

| Area | Score | Priority Issues |
|------|-------|-----------------|
| Architecture | 9/10 | Minor code duplication |
| Code Quality | 8/10 | Few `any` types, missing API route tests |
| Security | 8/10 | Dev secret fallback, no rate limiting |
| UI/Frontend | 7.5/10 | No error boundaries, oversized components |
| Testing | 7/10 | Good unit tests, missing API/integration tests |

---

## Phase 1: Critical (Do This Week)

### 1.1 Security: Remove Development Secret Fallback

**Priority:** HIGH | **Effort:** 15 min | **Risk:** Security vulnerability

The session module has a fallback secret that could leak into production.

**File:** `src/lib/session.ts:24-38`

```typescript
// BEFORE (unsafe)
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set...");
    }
    // Development fallback - NOT SECURE
    return new TextEncoder().encode("dev-secret-key-minimum-32-characters-long");
  }
  return new TextEncoder().encode(secret);
}

// AFTER (safe)
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable must be set and at least 32 characters. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}
```

**Action Items:**
- [ ] Update `src/lib/session.ts` to throw in all environments
- [ ] Update `.env.example` with generation instructions
- [ ] Add `SESSION_SECRET` to CI/CD environment checks

---

### 1.2 Type Safety: Fix `any` Types

**Priority:** HIGH | **Effort:** 30 min | **Risk:** Runtime errors

**Files with `any` types:**

| File | Line | Issue |
|------|------|-------|
| `src/actions/attachments.ts` | 12, 16 | `data?: any`, `rawData: any` |
| `src/app/(tech)/dashboard/tickets/page.tsx` | 455, 534 | `ticket: any` |

**Fix for attachments.ts:**
```typescript
// BEFORE
export type AttachmentActionState = {
  error?: string;
  success?: boolean;
  data?: any;
};

export async function createAttachment(rawData: any): Promise<AttachmentActionState>

// AFTER
import type { Attachment } from "@/db/schema";
import type { z } from "zod";
import { uploadAttachmentSchema } from "@/lib/validations/attachments";

type CreateAttachmentInput = z.infer<typeof uploadAttachmentSchema> & { s3Key: string };

export type AttachmentActionState = {
  error?: string;
  success?: boolean;
  data?: Attachment;
};

export async function createAttachment(
  rawData: CreateAttachmentInput
): Promise<AttachmentActionState>
```

**Fix for tickets/page.tsx:**
```typescript
// Create a type for ticket with relations
type TicketWithRelations = Awaited<ReturnType<typeof getTickets>>["tickets"][number];

function TicketCard({ ticket }: { ticket: TicketWithRelations }) { ... }
function TicketRow({ ticket }: { ticket: TicketWithRelations }) { ... }
```

**Action Items:**
- [ ] Fix `attachments.ts` types
- [ ] Create `TicketWithRelations` type
- [ ] Update `TicketCard` and `TicketRow` components

---

### 1.3 Stability: Add Error Boundaries

**Priority:** HIGH | **Effort:** 1 hour | **Risk:** App crashes without recovery

No error boundaries exist - component errors crash the entire app.

**Create error.tsx files:**

```typescript
// src/app/(admin)/admin/error.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-100">
        <AlertTriangle className="h-8 w-8 text-danger-600" />
      </div>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground text-center max-w-md">
        An error occurred while loading this page. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
```

**Action Items:**
- [ ] Create `src/app/(admin)/admin/error.tsx`
- [ ] Create `src/app/(tech)/dashboard/error.tsx`
- [ ] Create `src/app/(operator)/error.tsx`
- [ ] Create `src/app/error.tsx` (root fallback)

---

### 1.4 DX: Add Missing Script

**Priority:** LOW | **Effort:** 5 min | **Risk:** Documentation mismatch

AGENTS.md references `bun run build:check` which doesn't exist.

**Update package.json:**
```json
{
  "scripts": {
    "build:check": "tsc --noEmit",
    // ... existing scripts
  }
}
```

**Action Items:**
- [ ] Add `build:check` script to package.json

---

## Phase 2: High Priority (This Sprint)

### 2.1 Security: Add Rate Limiting

**Priority:** HIGH | **Effort:** 2 hours | **Risk:** DoS vulnerability

No rate limiting on API endpoints or login attempts.

**Implementation approach:**

```typescript
// src/lib/rate-limit.ts
import { LRUCache } from "lru-cache";

type RateLimitOptions = {
  interval: number; // ms
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject(new Error("Rate limit exceeded"));
        } else {
          resolve();
        }
      }),
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  try {
    await limiter.check(10, ip); // 10 requests per minute
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  // ... rest of handler
}
```

**Action Items:**
- [ ] Install `lru-cache` package
- [ ] Create `src/lib/rate-limit.ts`
- [ ] Add rate limiting to `/api/auth/login` (strict: 5/min)
- [ ] Add rate limiting to `/api/tickets` POST (moderate: 20/min)
- [ ] Add rate limiting to `/api/attachments` (moderate: 10/min)

---

### 2.2 Architecture: Extract Shared Auth Logic

**Priority:** MEDIUM | **Effort:** 2 hours | **Risk:** Code duplication bugs

Login logic is duplicated between `actions/auth.ts` and `api/auth/login/route.ts`.

**Create shared service:**

```typescript
// src/lib/services/auth.service.ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPin, isAccountLocked, calculateLockoutEnd, BRUTE_FORCE_CONFIG } from "@/lib/auth";
import { authLogger } from "@/lib/logger";
import { eq } from "drizzle-orm";

export type AuthResult =
  | { success: true; user: typeof users.$inferSelect }
  | { success: false; error: string; locked?: boolean };

export async function authenticateUser(
  employeeId: string,
  pin: string
): Promise<AuthResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  });

  if (!user) {
    return { success: false, error: "Invalid employee ID or PIN" };
  }

  if (!user.isActive) {
    return { success: false, error: "Account is disabled" };
  }

  if (isAccountLocked(user.lockedUntil)) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil!.getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      error: `Account locked. Try again in ${minutesLeft} minute(s).`,
      locked: true,
    };
  }

  const isValid = await verifyPin(pin, user.pin);

  if (!isValid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const lockout = newAttempts >= BRUTE_FORCE_CONFIG.maxAttempts
      ? calculateLockoutEnd()
      : null;

    await db.update(users).set({
      failedLoginAttempts: newAttempts,
      lockedUntil: lockout,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    if (lockout) {
      authLogger.warn({ employeeId, attempts: newAttempts }, "Account locked");
      return {
        success: false,
        error: "Too many failed attempts. Account locked for 15 minutes.",
        locked: true,
      };
    }

    return { success: false, error: "Invalid employee ID or PIN" };
  }

  // Reset failed attempts
  await db.update(users).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  authLogger.info({ employeeId, role: user.role }, "Successful login");
  return { success: true, user };
}
```

**Action Items:**
- [ ] Create `src/lib/services/auth.service.ts`
- [ ] Refactor `src/actions/auth.ts` to use service
- [ ] Refactor `src/app/api/auth/login/route.ts` to use service
- [ ] Add unit tests for auth service

---

### 2.3 Testing: Add API Route Tests

**Priority:** MEDIUM | **Effort:** 4 hours | **Risk:** Untested code paths

API routes have no test coverage.

**Example test structure:**

```typescript
// src/tests/unit/api/tickets.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/db", () => ({ db: { query: {}, insert: vi.fn(), select: vi.fn() } }));
vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(),
  requireCsrf: vi.fn(),
}));

import { GET, POST } from "@/app/api/tickets/route";
import { requireAuth, requireCsrf } from "@/lib/session";

describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/tickets");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns paginated tickets for authenticated user", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: 1,
      role: "tech",
      name: "Test",
      employeeId: "TECH-001",
    });

    // ... mock db queries and test response
  });
});

describe("POST /api/tickets", () => {
  it("returns 403 when CSRF token missing", async () => {
    vi.mocked(requireCsrf).mockRejectedValue(new Error("CSRF token missing"));

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});
```

**Action Items:**
- [ ] Create `src/tests/unit/api/tickets.test.ts`
- [ ] Create `src/tests/unit/api/equipment.test.ts`
- [ ] Create `src/tests/unit/api/auth.test.ts`
- [ ] Create `src/tests/unit/api/attachments.test.ts`
- [ ] Add API tests to CI pipeline

---

### 2.4 Consistency: Standardize ActionResult Types

**Priority:** MEDIUM | **Effort:** 1 hour | **Risk:** Inconsistent error handling

Different actions use different result types.

**Create unified type:**

```typescript
// src/lib/types/actions.ts
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Usage
export async function createTicket(
  _prevState: ActionResult<Ticket>,
  formData: FormData
): Promise<ActionResult<Ticket>> {
  // ...
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }
  // ...
  return { success: true, data: ticket };
}
```

**Action Items:**
- [ ] Create `src/lib/types/actions.ts`
- [ ] Update all server actions to use unified type
- [ ] Update form handling to use fieldErrors when available

---

## Phase 3: Medium Priority (Next Sprint)

### 3.1 UI: Split Large Components

**Priority:** MEDIUM | **Effort:** 2 hours | **Risk:** Maintainability

`TicketPartsManager` is 294 lines with mixed concerns.

**Proposed split:**

```
src/components/tickets/
├── ticket-parts-manager.tsx      # Orchestrator (50 lines)
├── parts/
│   ├── part-selector.tsx         # Part search/selection
│   ├── location-selector.tsx     # Location dropdown
│   ├── quantity-input.tsx        # Quantity with validation
│   └── parts-list.tsx            # Display added parts
└── hooks/
    └── use-ticket-parts.ts       # State management hook
```

**Action Items:**
- [ ] Create `src/components/tickets/hooks/use-ticket-parts.ts`
- [ ] Extract `PartSelector` component
- [ ] Extract `LocationSelector` component
- [ ] Extract `PartsList` component
- [ ] Refactor `TicketPartsManager` to compose sub-components

---

### 3.2 Security: Add Security Headers

**Priority:** MEDIUM | **Effort:** 2 hours | **Risk:** XSS, clickjacking

No security headers configured.

**Add middleware or next.config.ts headers:**

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' http://localhost:9000;",
          },
        ],
      },
    ];
  },
};
```

**Action Items:**
- [ ] Add security headers to `next.config.ts`
- [ ] Test CSP doesn't break functionality
- [ ] Add Strict-Transport-Security for production

---

### 3.3 Accessibility: Focus Management

**Priority:** MEDIUM | **Effort:** 2 hours | **Risk:** Accessibility compliance

Dialogs don't trap focus or return focus on close.

**Implementation:**

```typescript
// src/components/ui/dialog.tsx - Add focus trap
import { useFocusTrap } from "@/hooks/use-focus-trap";

const DialogContent = React.forwardRef<...>(({ ... }, ref) => {
  const containerRef = useFocusTrap();

  return (
    <DialogPrimitive.Content
      ref={mergeRefs([ref, containerRef])}
      // ...
    >
      {children}
    </DialogPrimitive.Content>
  );
});
```

**Action Items:**
- [ ] Create `src/hooks/use-focus-trap.ts`
- [ ] Update `Dialog` component with focus trap
- [ ] Add skip-to-content link in layouts
- [ ] Test with keyboard navigation

---

### 3.4 Observability: Add Request Logging

**Priority:** MEDIUM | **Effort:** 2 hours | **Risk:** Debugging difficulty

No request/response logging middleware.

**Action Items:**
- [ ] Create logging middleware for API routes
- [ ] Add correlation IDs to requests
- [ ] Log request duration, status codes
- [ ] Integrate with existing Pino logger

---

## Phase 4: Nice to Have (Backlog)

| Task | Effort | Impact | Notes |
|------|--------|--------|-------|
| Add virtualization for long lists | 3h | Performance | Use `@tanstack/react-virtual` |
| Server-side file content validation | 4h | Security | Verify file magic bytes |
| Add concurrent session limits | 3h | Security | Max 3 sessions per user |
| Document design system | 2h | DX | Custom CSS classes guide |
| Add performance monitoring | 4h | Observability | Consider Sentry or similar |
| Optimize backdrop-blur for mobile | 1h | Performance | Reduce blur on low-end devices |
| Add PWA offline support | 4h | UX | Service worker for offline mode |
| E2E test type safety | 2h | DX | Fix implicit any in Playwright tests |

---

## Implementation Checklist

### Week 1
- [ ] 1.1 - Remove dev secret fallback
- [ ] 1.2 - Fix `any` types
- [ ] 1.3 - Add error boundaries
- [ ] 1.4 - Add missing script

### Week 2
- [ ] 2.1 - Add rate limiting
- [ ] 2.2 - Extract shared auth logic
- [ ] 2.3 - Add API route tests (start)

### Week 3
- [ ] 2.3 - Complete API route tests
- [ ] 2.4 - Standardize ActionResult types
- [ ] 3.1 - Split TicketPartsManager

### Week 4
- [ ] 3.2 - Add security headers
- [ ] 3.3 - Focus management
- [ ] 3.4 - Request logging

---

## Success Metrics

After implementing Phase 1-2:
- [ ] Zero `any` types in production code
- [ ] All API routes have test coverage
- [ ] Error boundaries catch component crashes
- [ ] Rate limiting prevents abuse
- [ ] TypeScript strict mode passes

After implementing Phase 3:
- [ ] No component over 200 lines
- [ ] WCAG 2.1 AA compliance for focus management
- [ ] Security headers score A+ on securityheaders.com
- [ ] Request logs available for debugging

---

## Notes

- All changes should follow existing code patterns
- Run `bun run lint:fix` before committing
- Run `bun run test:run` to verify no regressions
- Update AGENTS.md if patterns change significantly
