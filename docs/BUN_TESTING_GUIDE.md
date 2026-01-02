# Bun + Happy-DOM Testing Guide

This document explains how to write component tests that work with Bun's test runner and happy-dom.

## The Problem

When using `@testing-library/react` with Bun and happy-dom, certain patterns that work in Jest/Vitest fail due to module initialization order:

1. **`screen` global fails** - Testing Library's `screen` checks for `document.body` at import time, before the preload script registers happy-dom
2. **`userEvent` fails** - Similar initialization timing issues with `userEvent.setup()`
3. **jest-dom matchers fail** - Matchers like `toBeInTheDocument()` may not work reliably

### Error Messages You Might See

```
TypeError: For queries bound to document.body a global document has to be available...
```

```
TypeError: undefined is not an object (evaluating 'document[isPrepared]')
```

## The Solution

Use patterns that don't depend on global DOM availability at module load time.

### ❌ Don't Use (Doesn't Work)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("tests something", async () => {
  render(<Button>Click</Button>);
  
  // ❌ screen.getBy* fails - document.body not available at import time
  expect(screen.getByRole("button")).toBeInTheDocument();
  
  // ❌ userEvent fails - same timing issue
  await userEvent.click(screen.getByRole("button"));
});
```

### ✅ Do Use (Works)

```tsx
// Option 1: Standard destructuring (Preferred for new tests)
import { render, fireEvent } from "@testing-library/react";

it("tests something", () => {
  const { getByRole } = render(<Button>Click</Button>);
  expect(getByRole("button")).toBeDefined();
  getByRole("button").click();
});

// Option 2: Using the specialized dom-setup wrapper (If screen is required)
import { render, screen } from "@/tests/dom-setup";

it("tests via screen", () => {
  render(<Button>Click</Button>);
  expect(screen.getByRole("button")).toBeDefined();
});
```

## Pattern Replacements

| ❌ Old Pattern | ✅ New Pattern |
|---------------|---------------|
| `screen.getByRole("button")` | `const { getByRole } = render(...); getByRole("button")` |
| `userEvent.click(element)` | `element.click()` |
| `userEvent.type(input, "text")` | `fireEvent.change(input, { target: { value: "text" } })` |
| `.toBeInTheDocument()` | `.toBeDefined()` |
| `expect(screen.queryByText("X")).not.toBeInTheDocument()` | `expect(queryByText("X")).toBeNull()` |
| `.toHaveClass("foo")` | `.classList.contains("foo")).toBe(true)` |
| `.toBeDisabled()` | `.hasAttribute("disabled")).toBe(true)` |
| `.toHaveAttribute("x", "y")` | `.getAttribute("x")).toBe("y")` |

## Event Handling

For interactions that trigger React state changes, `fireEvent` is often more reliable than manual `dispatchEvent`:

```tsx
import { render, fireEvent } from "@testing-library/react";

it("handles input", () => {
  const { getByRole } = render(<Input />);
  const input = getByRole("textbox") as HTMLInputElement;
  
  // Use fireEvent for reliable React state updates
  fireEvent.change(input, { target: { value: "Hello" } });
  
  expect(input.value).toBe("Hello");
});

it("handles focus/blur", () => {
  const { getByRole } = render(<Input />);
  const input = getByRole("textbox");
  
  input.focus();
  input.blur();
});
```

## Migration Script

A migration script is available to automate some of the conversions:

```bash
# Dry run - see what would change
bun scripts/migrate-component-tests.ts --dry-run

# Apply changes
bun scripts/migrate-component-tests.ts

# Process a specific file
bun scripts/migrate-component-tests.ts --file src/tests/unit/components/input.test.tsx
```

The script handles:
- Removing `screen` from imports
- Removing `userEvent` imports
- Converting `toBeInTheDocument()` → `toBeDefined()`
- Converting `toHaveClass()` → `classList.contains()`
- Converting `toBeDisabled()` → `hasAttribute("disabled")`
- Converting `toHaveAttribute()` → `getAttribute()`

**Note:** The script adds TODO comments for changes that require manual intervention (like restructuring `render()` calls to destructure queries).

## Setup Files

### `src/tests/setup.ts` (Preload)

This file is loaded before every test via `bunfig.toml`:

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Extend expect with jest-dom matchers
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "bun:test";
expect.extend(matchers);

// Clean up DOM between tests
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "bun:test";

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  cleanup();
});
```

### `bunfig.toml`

```toml
[test]
preload = ["./src/tests/setup.ts"]
smol = true
```

## Running Tests

```bash
# Run all component tests (isolated per file)
for f in src/tests/unit/components/*.test.tsx; do bun test "$f" || exit 1; done

# Run a single test file
bun test ./src/tests/unit/components/button.test.tsx

# Run all tests
bun run test
```

## Why This Happens

Bun loads and parses test file imports **before** running preload scripts. When `@testing-library/dom/screen.js` is imported, it immediately checks:

```js
if (!document.body) {
  throw new TypeError('document.body must be available');
}
```

Since happy-dom hasn't registered yet, `document` is undefined and this check fails.

By using `render()`'s returned queries instead of the global `screen`, we defer the DOM access to runtime (inside the test function), when happy-dom is guaranteed to be registered.

---

*Last Updated: 2026-01-02*
