# Testing Guide

This directory contains unit tests for the FixIt application.

## Running Tests

```bash
# Run all unit tests
bun test src

# Run specific test directory
bun test src/tests/unit/actions

# Run specific test file (RECOMMENDED for action tests)
bun test src/tests/unit/actions/users.test.ts

# Watch mode
bun test src --watch
```

## Test Structure

```
src/tests/
├── setup.ts              # Global test setup (happy-dom, jest-dom matchers)
├── bun-compat.ts         # Vitest compatibility shim (deprecated, migrating away)
└── unit/
    ├── actions/          # Server action tests
    ├── api/              # API route tests
    ├── components/       # React component tests
    ├── lib/              # Library function tests
    └── services/         # Service layer tests
```

## Mocking

### Using Bun's Native Mocks

```typescript
import { mock, beforeEach, describe, expect, it } from "bun:test";

// Create mock functions
const mockGetCurrentUser = mock();

// Mock entire modules (MUST be before dynamic imports)
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Dynamic import AFTER mocks are set up
const { myAction } = await import("@/actions/myAction");

describe("myAction", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
  });

  it("should work", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "1", permissions: ["*"] });
    const result = await myAction();
    expect(result.success).toBe(true);
  });
});
```

### Global Mocks (setup.ts)

The following modules are mocked globally in `setup.ts`:
- `next/navigation` - redirect, usePathname, useRouter
- `next/headers` - cookies
- `next/cache` - revalidatePath, revalidateTag

## ⚠️ Known Issue: Test Interference

### The Problem

Bun's `mock.module()` modifies the **global module cache**. When running multiple test files together, mocks from one file can affect another.

```bash
# This may have failures due to interference:
bun test src/tests/unit/actions

# But individual files pass:
bun test src/tests/unit/actions/users.test.ts  # ✅
bun test src/tests/unit/actions/roles.test.ts  # ✅
```

### Why This Happens

Unlike Jest/Vitest which isolate each test file, Bun runs all tests in the same process with a shared module cache. When File A mocks `@/lib/auth`, File B may receive that mock instead of its own.

### Workarounds

#### 1. Run tests file-by-file (CI recommended)
```bash
for f in src/tests/unit/actions/*.test.ts; do bun test "$f" || exit 1; done
```

#### 2. Run individual files when debugging
```bash
bun test src/tests/unit/actions/users.test.ts
```

#### 3. For new code: Use Dependency Injection
Instead of relying on module mocking, pass dependencies as parameters:

```typescript
// Instead of this (hard to mock):
export async function createUser(formData: FormData) {
  const user = await getCurrentUser(); // imported at module level
  // ...
}

// Do this (easy to test):
export async function createUser(
  formData: FormData,
  deps = { getCurrentUser, db }
) {
  const user = await deps.getCurrentUser();
  // ...
}

// Tests become simple:
it("should work", async () => {
  await createUser(formData, { 
    getCurrentUser: async () => mockUser,
    db: mockDb 
  });
});
```

## Writing New Tests

### Action Tests Pattern

```typescript
import { PERMISSIONS as PERMISSIONS_SOURCE } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

// 1. Create mocks
const mockGetCurrentUser = mock();
const mockFindFirst = mock();

// 2. Mock modules BEFORE any imports that use them
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

mock.module("@/db", () => ({
  db: {
    query: {
      users: { findFirst: mockFindFirst },
    },
  },
}));

// 3. Dynamic import AFTER mocks
const { myAction } = await import("@/actions/myAction");

// 4. Tests
describe("myAction", () => {
  beforeEach(() => {
    // Clear all mocks
    mockGetCurrentUser.mockClear();
    mockFindFirst.mockClear();
  });

  it("should return error if not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const result = await myAction();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });
});
```

### Component Tests Pattern

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "bun:test";
import { MyComponent } from "@/components/my-component";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## Configuration

### bunfig.toml
```toml
[test]
preload = ["./src/tests/setup.ts"]
smol = true
```

### setup.ts
- Registers happy-dom for browser APIs
- Extends expect with jest-dom matchers
- Provides `createMockUser()` helper
- Sets up global Next.js mocks
