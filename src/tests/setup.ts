import { GlobalRegistrator } from "@happy-dom/global-registrator";
import * as matchers from "@testing-library/jest-dom/matchers";

GlobalRegistrator.register();

import type { SessionUser } from "@/lib/session";
import { expect, mock } from "bun:test";

expect.extend(matchers);

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
mock.module("next/navigation", () => ({
  redirect: mock(),
  usePathname: mock(() => "/"),
  useRouter: mock(() => ({
    push: mock(),
    replace: mock(),
    back: mock(),
  })),
}));

// Mock next/headers
mock.module("next/headers", () => ({
  cookies: mock(() => ({
    get: mock(),
    set: mock(),
    delete: mock(),
  })),
}));

// Mock next/cache
mock.module("next/cache", () => ({
  revalidatePath: mock(),
  revalidateTag: mock(),
}));
