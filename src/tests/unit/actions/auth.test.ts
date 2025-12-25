import { login } from "@/actions/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  verifyPin: vi.fn(),
}));

import { db } from "@/db";
import { verifyPin } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

describe("login action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid input format", async () => {
    const formData = new FormData();
    formData.set("employeeId", "");
    formData.set("pin", "12"); // too short

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid employee ID or PIN format");
  });

  it("should return error for non-existent user", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("employeeId", "UNKNOWN-001");
    formData.set("pin", "1234");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid employee ID or PIN");
  });

  it("should return error for inactive user", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      pin: "hashed",
      role: "tech",
      isActive: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "1234");

    const result = await login({}, formData);

    expect(result.error).toBe(
      "Account is disabled. Please contact an administrator."
    );
  });

  it("should return error for locked account", async () => {
    const futureDate = new Date(Date.now() + 10 * 60000); // 10 minutes from now
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      pin: "hashed",
      role: "tech",
      isActive: true,
      failedLoginAttempts: 5,
      lockedUntil: futureDate,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "1234");

    const result = await login({}, formData);

    expect(result.error).toMatch(/Account is locked/);
    expect(result.error).toMatch(/\d+ minute/);
  });

  it("should return error and increment attempts for wrong PIN", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      pin: "hashed",
      role: "tech",
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPin).mockResolvedValue(false);

    const mockUpdate = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    }));
    vi.mocked(db.update as unknown as typeof mockUpdate).mockImplementation(
      mockUpdate
    );

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "wrong");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid employee ID or PIN");
    expect(db.update).toHaveBeenCalled();
  });

  it("should lock account after 5 failed attempts", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      pin: "hashed",
      role: "tech",
      isActive: true,
      failedLoginAttempts: 4, // Will become 5 after this attempt
      lockedUntil: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPin).mockResolvedValue(false);

    let capturedSetData: Record<string, unknown> = {};
    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn((data) => {
        capturedSetData = data;
        return { where: vi.fn() };
      }),
    } as unknown);

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "wrong");

    const result = await login({}, formData);

    expect(result.error).toBe(
      "Too many failed attempts. Account locked for 15 minutes."
    );
    expect(capturedSetData.failedLoginAttempts).toBe(5);
    expect(capturedSetData.lockedUntil).toBeDefined();
  });

  it("should create session and redirect on successful login", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      pin: "hashed",
      role: "tech",
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPin).mockResolvedValue(true);
    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "1234");

    // redirect throws an error in Next.js, so we catch it
    try {
      await login({}, formData);
    } catch {
      // redirect throws NEXT_REDIRECT error
    }

    expect(createSession).toHaveBeenCalledWith({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      role: "tech",
    });
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("should redirect admin to /admin", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin User",
      pin: "hashed",
      role: "admin",
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPin).mockResolvedValue(true);
    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("employeeId", "ADMIN-001");
    formData.set("pin", "1234");

    try {
      await login({}, formData);
    } catch {
      // redirect throws
    }

    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("should redirect operator to /", async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator User",
      pin: "hashed",
      role: "operator",
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPin).mockResolvedValue(true);
    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("employeeId", "OP-001");
    formData.set("pin", "1234");

    try {
      await login({}, formData);
    } catch {
      // redirect throws
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });
});
