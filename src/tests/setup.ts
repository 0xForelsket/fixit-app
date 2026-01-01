import "@testing-library/jest-dom/vitest";
import type { SessionUser } from "@/lib/session";
import { vi } from "vitest";

// Shared mock user for tests
export const createMockUser = (
  overrides: Partial<SessionUser> = {}
): SessionUser => ({
  id: 1,
  employeeId: "TEST-001",
  name: "Test User",
  roleId: 2,
  roleName: "tech",
  departmentId: 1,
  permissions: ["ticket:create", "ticket:view"],
  hourlyRate: 25.0,
  sessionVersion: 1,
  ...overrides,
});

export const mockAdminUser: SessionUser = createMockUser({
  employeeId: "ADMIN-001",
  name: "Admin User",
  roleId: 1,
  roleName: "admin",
  permissions: ["*"],
  hourlyRate: 50.0,
});

export const mockTechUser: SessionUser = createMockUser({
  employeeId: "TECH-001",
  name: "Tech User",
  roleId: 2,
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
