import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Must register BEFORE any other imports that depend on DOM
GlobalRegistrator.register();

import type { SessionUser } from "@/lib/session";
// Now import testing-library (after DOM is available)
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";

expect.extend(matchers);

// Re-export testing library utilities for tests to use
// (ensures they are imported AFTER GlobalRegistrator.register())
export { render, screen } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Reset DOM before each test
beforeEach(() => {
  document.body.innerHTML = "";
});

// Clean up DOM after each test to prevent test pollution
afterEach(() => {
  cleanup();
});

// Shared mock user for tests
export const createMockUser = (
  overrides: Partial<SessionUser> = {}
): SessionUser => ({
  id: "user-1",
  displayId: 1,
  employeeId: "TEST-001",
  name: "Test User",
  roleId: "role-2",
  roleName: "tech",
  departmentId: "dept-1",
  permissions: ["ticket:create", "ticket:view"],
  hourlyRate: 25.0,
  sessionVersion: 1,
  ...overrides,
});

export const mockAdminUser: SessionUser = createMockUser({
  employeeId: "ADMIN-001",
  name: "Admin User",
  roleId: "1",
  roleName: "admin",
  permissions: ["*"],
  hourlyRate: 50.0,
});

export const mockTechUser: SessionUser = createMockUser({
  employeeId: "TECH-001",
  name: "Tech User",
  roleId: "2",
  roleName: "tech",
  permissions: ["ticket:create", "ticket:view", "ticket:update"],
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
