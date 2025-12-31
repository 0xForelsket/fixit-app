# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FixIt is a self-hosted CMMS (Computerized Maintenance Management System) for manufacturing maintenance tracking. Built with Next.js 15 (App Router), React 19, TypeScript, SQLite/LibSQL via Drizzle ORM, and Tailwind CSS 4.

## Commands

```bash
# Development
bun run dev              # Start dev server with Turbopack

# Type checking & linting (run before commits)
bun run build:check      # TypeScript compilation check
bun run lint             # Check code with Biome
bun run lint:fix         # Auto-fix lint issues

# Testing
bun run test             # Unit tests (watch mode)
bun run test:run         # Unit tests (single run)
bun run e2e              # Playwright e2e tests
bun run e2e:ui           # Playwright UI mode

# Database
bun run db:push          # Push schema changes to database
bun run db:seed          # Seed development data
bun run db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Route Groups
- `src/app/(app)/` - Main authenticated application (dashboard, work orders, equipment, admin)
- `src/app/(auth)/` - Authentication routes (login)
- `src/app/(marketing)/` - Public marketing pages
- `src/app/api/` - REST API endpoints

### Key Directories
- `src/actions/` - Server Actions for mutations (use `"use server"` directive)
- `src/components/ui/` - Reusable UI primitives (shadcn/Radix pattern)
- `src/db/schema.ts` - Drizzle ORM schema (all entity types and relations)
- `src/lib/validations/` - Zod validation schemas
- `src/lib/session.ts` - JWT session management, `getCurrentUser`, `requireAuth`
- `src/lib/permissions.ts` - Permission constants (`PERMISSIONS.TICKET_CREATE`, etc.)

### Authentication Flow
- PIN-based login (not passwords)
- JWT in HttpOnly cookie (`fixit_session`)
- CSRF token required for mutations (`x-csrf-token` header)
- Permission-based access: `resource:action` pattern (e.g., `ticket:create`, `equipment:update`)

## Code Patterns

### Server Actions
```typescript
"use server";

import { getCurrentUser } from "@/lib/session";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import type { ActionResult } from "@/lib/types/actions";
import { revalidatePath } from "next/cache";

export async function myAction(
  _prevState: ActionResult<MyType> | undefined,
  formData: FormData
): Promise<ActionResult<MyType>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!userHasPermission(user.permissions, PERMISSIONS.SOME_PERMISSION)) {
    return { success: false, error: "Forbidden" };
  }

  // Validate with Zod, perform action...

  revalidatePath("/relevant-path");
  return { success: true, data: result };
}
```

### Using Actions in Components
```typescript
import { useActionState } from "react";

const [state, formAction] = useActionState(myAction, undefined);

// Check result
if (state && !state.success) {
  console.log(state.error);
}
```

### Permission Checks in Server Components
```typescript
import { getCurrentUser } from "@/lib/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const user = await getCurrentUser();
if (user && hasPermission(user.permissions, PERMISSIONS.ANALYTICS_VIEW)) {
  // Render protected content
}
```

### Database Queries
```typescript
import { db } from "@/db";
import { workOrders, equipment } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const results = await db.query.workOrders.findMany({
  where: eq(workOrders.status, "open"),
  with: { equipment: true, assignedTo: true },
  orderBy: [desc(workOrders.createdAt)],
});
```

## Domain Concepts

### Work Order Flow
`open` → `in_progress` → `resolved` → `closed`

### Work Order Types
`breakdown`, `maintenance`, `calibration`, `safety`, `upgrade`

### SLA Priority → Response Time
- Critical: 2 hours
- High: 8 hours
- Medium: 24 hours
- Low: 72 hours

### User Roles
Default roles: `operator`, `tech`, `admin`. Custom roles can be created via Admin UI with any permission combination. Special permission `*` grants all access.

## Import Aliases

Always use `@/` prefix for imports from `src/`:
```typescript
import { db } from "@/db";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
```

## File Naming

- Components: `kebab-case.tsx` (e.g., `work-order-card.tsx`)
- Pages: `page.tsx`, layouts: `layout.tsx`
- Tests: `*.test.ts` (unit), `*.spec.ts` (e2e)

## Before Committing

1. `bun run lint:fix` - Fix lint issues
2. `bun run build:check` - Verify TypeScript compiles
3. `bun run test:run` - Run unit tests
