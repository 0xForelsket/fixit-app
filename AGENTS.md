# AGENTS.md

This file provides guidance for AI agents working with this codebase.

> **Last Updated:** December 28, 2025  
> **See Also:** `improvement_plan.md` for current technical debt and priorities

## Project Overview

FixIt is a CMMS (Computerized Maintenance Management System) for tracking machine maintenance tickets. It uses permission-based access control with customizable roles:
- **Operators**: Report machine issues via QR code scanning
- **Technicians**: Manage and resolve tickets, track machine maintenance
- **Administrators**: Manage users, machines, locations, roles, and configuration

Custom roles can be created with any combination of permissions via the Admin UI.

## Tech Stack

- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite/LibSQL via Drizzle ORM
- **Styling**: Tailwind CSS 4
- **Validation**: Zod schemas
- **Auth**: JWT sessions with CSRF protection
- **Testing**: Vitest + Testing Library, Playwright (e2e)
- **Linting**: Biomejs
- **PWA**: next-pwa for service worker generation

## Key Commands

```bash
# Development
bun run dev                # Start dev server (Turbopack)

# Linting (run before committing)
bun run lint               # Check for issues
bun run lint:fix           # Auto-fix issues

# Type checking
bun run build:check        # TypeScript compilation check (tsc --noEmit)

# Testing
bun run test               # Unit tests - watch mode
bun run test:run           # Unit tests - single run
bun run e2e                # Playwright e2e tests
bun run e2e:ui             # Playwright UI mode

# Database
bun run db:push            # Push schema changes
bun run db:seed            # Seed development data
bun run db:generate        # Generate migrations
bun run db:studio          # Open Drizzle Studio
```

## Directory Structure

```
src/
├── app/                   # Next.js pages and routes
│   ├── (auth)/           # Auth routes (login)
│   ├── (main)/           # Main authenticated routes
│   │   ├── admin/        # Admin panel
│   │   ├── dashboard/    # Technician dashboard
│   │   ├── maintenance/  # Work orders, schedules
│   │   └── assets/       # Equipment management
│   ├── (operator)/       # Simplified operator interface
│   └── api/              # REST API endpoints
├── actions/              # Server Actions (mutations)
├── components/           
│   ├── ui/               # Reusable UI primitives
│   ├── layout/           # Headers, sidebars, navigation
│   └── [feature]/        # Feature-specific components
├── db/
│   ├── schema.ts         # Drizzle ORM schema
│   ├── index.ts          # Database client
│   └── seed.ts           # Seed data
├── lib/
│   ├── auth.ts           # Auth utilities (PIN hashing, lockout)
│   ├── session.ts        # JWT session management
│   ├── permissions.ts    # Permission constants and helpers
│   ├── rate-limit.ts     # Rate limiting utility
│   ├── sla.ts            # SLA calculations
│   ├── s3.ts             # S3/MinIO client
│   └── validations/      # Zod schemas
└── tests/                # Unit tests
e2e/                       # Playwright e2e tests
```

## Coding Conventions

### File Naming
- Pages: `page.tsx`, Layouts: `layout.tsx`, Errors: `error.tsx`
- Components: `kebab-case.tsx` (e.g., `stats-card.tsx`)
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` (unit), `*.spec.ts` (e2e)

### Import Aliases
Use `@/` prefix for all imports from `src/`:
```typescript
import { db } from "@/db";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
```

### Component Patterns
- UI components use CVA (Class Variance Authority) for variants
- Extend native HTML props where applicable:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
}
```

### Server Actions
- Define with `"use server"` directive at top of file
- Always validate input with Zod schemas
- Use `revalidatePath()` after mutations
- Return `ActionResult` type for consistent error handling:

```typescript
// Defined in @/lib/types/actions.ts
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Usage in actions
export async function createTicket(
  _prevState: ActionResult<Ticket> | undefined,  // Note: undefined, not {}
  formData: FormData
): Promise<ActionResult<Ticket>> {
  // ...
}

// Usage in components with useActionState
const [state, formAction] = useActionState(createTicket, undefined);  // Initial state is undefined

if (state && !state.success) {
  console.log(state.error);  // TypeScript knows error exists
}
```

### Database Queries
- Use Drizzle ORM, never raw SQL
- Import from `@/db` and `@/db/schema`
- Prefer explicit column selection over `select()`

### Validation
- Schemas live in `src/lib/validations/`
- Use `z.infer<typeof schema>` for TypeScript types
- Validate at system boundaries (Server Actions, API routes)

## Authentication & Authorization

- PIN-based login (not passwords)
- JWT stored in httpOnly cookie (`fixit_session`)
- CSRF token in separate cookie (`fixit_csrf`)
- Permission-based access control (not role-based)
- Rate limiting on login (5 attempts/minute)
- Account lockout after 5 failed attempts (15 min)

### SessionUser Shape
```typescript
interface SessionUser {
  id: number;
  employeeId: string;
  name: string;
  roleName: string;           // Role name (e.g., "operator", "tech", "admin")
  roleId?: number | null;     // FK to roles table
  permissions: string[];      // Array of permission strings
  hourlyRate?: number | null;
}
```

### Permission System
Permissions follow the pattern `resource:action` (e.g., `ticket:create`, `equipment:update`).
Special permission `*` grants all permissions (superadmin).

```typescript
import { PERMISSIONS } from "@/lib/permissions";

PERMISSIONS.TICKET_CREATE      // "ticket:create"
PERMISSIONS.EQUIPMENT_UPDATE   // "equipment:update"
PERMISSIONS.SYSTEM_SETTINGS    // "system:settings"
PERMISSIONS.ALL                // "*" (superadmin)
```

### Protected Actions
```typescript
// Import from session.ts for session-based auth
import { requireAuth, requirePermission, requireAnyPermission } from "@/lib/session";

// Or from auth.ts (which re-exports and adds utility functions)
import { requirePermission, requireAnyPermission, PERMISSIONS } from "@/lib/auth";

export async function someAction() {
  "use server";
  const user = await requireAuth();  // Throws "Unauthorized" if not logged in

  // Require specific permission - throws "Forbidden" if missing
  await requirePermission(PERMISSIONS.TICKET_CREATE);

  // Require any of multiple permissions
  await requireAnyPermission([PERMISSIONS.TICKET_UPDATE, PERMISSIONS.TICKET_RESOLVE]);
}
```

### Checking Permissions in Components
```typescript
import { hasPermission, hasAnyPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

// In server components
const user = await getCurrentUser();

if (user && hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
  // Show analytics
}
```

## Testing

### Test Location
- Unit tests: `src/tests/unit/`
- E2E tests: `e2e/`
- Test setup: `src/tests/setup.ts`

### Running Tests
```bash
bun run test:run           # Run all unit tests once
bun run test               # Watch mode
bun run e2e                # Run e2e tests
```

### Mocking Patterns
Next.js modules are mocked in `src/tests/setup.ts`:
- `next/navigation`
- `next/headers`
- `next/cache`

### Test Data Types
When mocking `SessionUser`, use the correct shape:
```typescript
const mockUser: SessionUser = {
  id: 1,
  employeeId: "TECH-001",
  name: "Test User",
  roleName: "tech",              // NOT 'role'
  roleId: 2,
  permissions: ["ticket:create", "ticket:view", "ticket:update"],
  hourlyRate: null,
};
```

## Common Patterns

### SLA Calculation
Priority maps to hours: critical=2, high=8, medium=24, low=72
```typescript
import { calculateDueBy } from "@/lib/sla";
const dueBy = calculateDueBy("high"); // 8 hours from now
```

### Rate Limiting
```typescript
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const ip = getClientIp(request);
const { success, remaining } = checkRateLimit(
  `login:${ip}`,
  RATE_LIMITS.login.limit,
  RATE_LIMITS.login.windowMs
);

if (!success) {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

### Attachments
- Stored in S3/MinIO, metadata in DB
- Use presigned URLs for uploads/downloads
- Polymorphic: attach to work orders, equipment, users, locations

### Work Order Status Flow
`open` → `in_progress` → `resolved` → `closed`

### Work Order Types
`breakdown`, `maintenance`, `calibration`, `safety`, `upgrade`

## Important Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Database schema, types, enums |
| `src/lib/session.ts` | JWT session management, `getCurrentUser`, `requireAuth` |
| `src/lib/auth.ts` | Auth utilities (PIN hashing, lockout, permission helpers) |
| `src/lib/permissions.ts` | Permission constants and `hasPermission` helpers |
| `src/lib/rate-limit.ts` | Rate limiting for API routes |
| `src/lib/validations/*.ts` | Zod validation schemas |
| `src/actions/*.ts` | Server Actions for mutations |
| `improvement_plan.md` | Current technical debt and priorities |

## Before Submitting Changes

1. Run linting: `bun run lint:fix`
2. Run type check: `bun run build:check`
3. Run tests: `bun run test:run`
4. Ensure no console errors in dev mode

## Common Pitfalls

- **Don't use `"use client"` unnecessarily** - Default to Server Components
- **Always validate user input** - Use Zod schemas from `lib/validations/`
- **Don't store secrets in code** - Use environment variables
- **Don't modify sessions directly** - Use `createSession()` and `deleteSession()`
- **Always revalidate after mutations** - Call `revalidatePath()` in Server Actions
- **Use correct ActionResult pattern** - Initial state is `undefined`, not `{}`
- **Check success before accessing result properties** - `if (!result.success) { result.error }`
- **SessionUser uses `roleName`** - Not `role` (legacy tests may have this wrong)
