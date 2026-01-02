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
import { render } from "@testing-library/react";

it("tests something", () => {
  // ✅ Destructure queries from render()
  const { getByRole, getByText, getByTestId } = render(<Button>Click</Button>);
  
  // ✅ Use native assertions
  expect(getByRole("button")).toBeDefined();
  
  // ✅ Use native DOM click
  getByRole("button").click();
});
```

## Pattern Replacements

| ❌ Old Pattern | ✅ New Pattern |
|---------------|---------------|
| `screen.getByRole("button")` | `const { getByRole } = render(...); getByRole("button")` |
| `screen.getByText("Hello")` | `const { getByText } = render(...); getByText("Hello")` |
| `screen.getByTestId("foo")` | `const { getByTestId } = render(...); getByTestId("foo")` |
| `userEvent.click(element)` | `element.click()` |
| `userEvent.type(input, "text")` | `input.value = "text"; input.dispatchEvent(new Event("change"))` |
| `.toBeInTheDocument()` | `.toBeDefined()` |
| `.toHaveClass("foo")` | `.classList.contains("foo")).toBe(true)` |
| `.toBeDisabled()` | `.hasAttribute("disabled")).toBe(true)` |
| `.toHaveAttribute("type", "submit")` | `.getAttribute("type")).toBe("submit")` |

## Typing Events

For more complex user interactions (typing, keyboard events):

```tsx
it("handles typing", () => {
  const { getByRole } = render(<Input />);
  const input = getByRole("textbox") as HTMLInputElement;
  
  // Native approach
  input.value = "new value";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  
  expect(input.value).toBe("new value");
});
```

## Focus/Blur Events

```tsx
it("handles focus", () => {
  const onFocus = mock(() => {});
  const { getByRole } = render(<Input onFocus={onFocus} />);
  
  getByRole("textbox").focus();
  
  expect(onFocus).toHaveBeenCalled();
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
