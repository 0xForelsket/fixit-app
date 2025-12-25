# AGENTS.md

This file provides guidance for AI agents working with this codebase.

## Project Overview

FixIt is a CMMS (Computerized Maintenance Management System) for tracking machine maintenance tickets. It serves three user roles:
- **Operators**: Report machine issues via QR code scanning
- **Technicians**: Manage and resolve tickets, track machine maintenance
- **Administrators**: Manage users, machines, locations, and configuration

## Tech Stack

- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite/LibSQL via Drizzle ORM
- **Styling**: Tailwind CSS 4
- **Validation**: Zod schemas
- **Auth**: JWT sessions with CSRF protection
- **Testing**: Vitest + Testing Library
- **Linting**: Biomejs

## Key Commands

```bash
# Development
bun run dev                # Start dev server

# Linting (run before committing)
bun run lint               # Check for issues
bun run lint:fix           # Auto-fix issues

# Type checking
bun run build:check        # TypeScript compilation check

# Testing
bun run test               # Watch mode
bun run test:run           # Single run

# Database
bun run db:push            # Push schema changes
bun run db:generate        # Generate migrations
bun run db:studio          # Open Drizzle Studio
```

## Directory Structure

```
src/
├── app/                   # Next.js pages and routes
│   ├── (auth)/           # Auth routes (login)
│   ├── (operator)/       # Operator interface
│   ├── (tech)/dashboard/ # Technician dashboard
│   └── api/              # REST API endpoints
├── actions/              # Server Actions (mutations)
├── components/ui/        # Reusable UI components
├── db/                   # Database schema and client
├── lib/                  # Utilities and helpers
│   └── validations/      # Zod schemas
└── tests/                # Test files
```

## Coding Conventions

### File Naming
- Pages: `page.tsx`, Layouts: `layout.tsx`
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts`

### Import Aliases
Use `@/` prefix for all imports from `src/`:
```typescript
import { db } from "@/db";
import { Button } from "@/components/ui/button";
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
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

### Database Queries
- Use Drizzle ORM, never raw SQL
- Import from `@/db` and `@/db/schema`
- Prefer explicit column selection over `select()`

### Validation
- Schemas live in `src/lib/validations/`
- Use `z.infer<typeof schema>` for TypeScript types
- Validate at system boundaries (Server Actions, API routes)

## Authentication

- PIN-based login (not passwords)
- JWT stored in httpOnly cookie (`fixit_session`)
- CSRF token in separate cookie (`fixit_csrf`)
- Role hierarchy: Operator < Tech < Admin

### Protected Actions
```typescript
import { requireAuth, requireRole } from "@/lib/auth";

export async function someAction() {
  "use server";
  const user = await requireAuth();  // Throws if not logged in
  // or
  const admin = await requireRole("admin");  // Throws if not admin
}
```

## Testing

### Test Location
- Unit tests: `src/tests/unit/`
- Test files mirror source structure

### Running Tests
```bash
bun run test:run           # Run all tests once
bun run test               # Watch mode
```

### Mocking Patterns
Next.js modules are mocked in `src/tests/setup.ts`:
- `next/navigation`
- `next/headers`
- `next/cache`

## Common Patterns

### SLA Calculation
Priority maps to hours: critical=2, high=8, medium=24, low=72
```typescript
import { calculateDueBy } from "@/lib/sla";
const dueBy = calculateDueBy("high"); // 8 hours from now
```

### Attachments
- Stored in S3/MinIO, metadata in DB
- Use presigned URLs for uploads/downloads
- Polymorphic: attach to tickets, machines, users, locations

### Ticket Status Flow
`open` → `in_progress` → `resolved` → `closed`

### Ticket Types
`breakdown`, `maintenance`, `calibration`, `safety`, `upgrade`

## Important Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Database schema, types, enums |
| `src/lib/session.ts` | JWT session management |
| `src/lib/auth.ts` | Auth utilities |
| `src/lib/validations/*.ts` | Zod validation schemas |
| `src/actions/*.ts` | Server Actions for mutations |

## Before Submitting Changes

1. Run linting: `bun run lint:fix`
2. Run type check: `bun run build:check`
3. Run tests: `bun run test:run`
4. Ensure no console errors in dev mode

## Common Pitfalls

- **Don't use `"use client"` unnecessarily** - Default to Server Components
- **Always validate user input** - Use Zod schemas from `lib/validations/`
- **Don't store secrets in code** - Use environment variables
- **Don't modify sessions directly** - Use `createSession()` and `destroySession()`
- **Always revalidate after mutations** - Call `revalidatePath()` in Server Actions
