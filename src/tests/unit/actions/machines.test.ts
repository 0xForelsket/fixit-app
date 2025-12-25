import {
  createMachine,
  deleteMachine,
  updateMachine,
} from "@/actions/machines";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      machines: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("createMachine action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Test Machine");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createMachine({}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    const formData = new FormData();
    formData.set("name", "Test Machine");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createMachine({}, formData);

    expect(result.error).toBe("Only administrators can create machines");
  });

  it("should reject operator users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const formData = new FormData();
    formData.set("name", "Test Machine");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createMachine({}, formData);

    expect(result.error).toBe("Only administrators can create machines");
  });

  it("should return error for invalid input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    const formData = new FormData();
    formData.set("name", ""); // Empty name
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createMachine({}, formData);

    expect(result.error).toBeDefined();
  });

  it("should create machine successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    const mockMachine = {
      id: 1,
      name: "Test Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockMachine]),
      })),
    } as unknown);

    const formData = new FormData();
    formData.set("name", "Test Machine");
    formData.set("code", "tm-001"); // Lowercase - should be uppercased
    formData.set("locationId", "1");

    const result = await createMachine({}, formData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockMachine);
  });

  it("should handle duplicate code error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi
          .fn()
          .mockRejectedValue(
            new Error("UNIQUE constraint failed: machines.code")
          ),
      })),
    } as unknown);

    const formData = new FormData();
    formData.set("name", "Test Machine");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createMachine({}, formData);

    expect(result.error).toBe("A machine with this code already exists");
  });
});

describe("updateMachine action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateMachine(1, {}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateMachine(1, {}, formData);

    expect(result.error).toBe("Only administrators can update machines");
  });

  it("should return error for non-existent machine", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateMachine(999, {}, formData);

    expect(result.error).toBe("Machine not found");
  });

  it("should update machine successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Old Name",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateMachine(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("should log status change", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("status", "down");

    const result = await updateMachine(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled(); // For status change log
  });

  it("should handle duplicate code error on update", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({
        where: vi
          .fn()
          .mockRejectedValue(
            new Error("UNIQUE constraint failed: machines.code")
          ),
      })),
    } as unknown);

    const formData = new FormData();
    formData.set("code", "EXISTING-CODE");

    const result = await updateMachine(1, {}, formData);

    expect(result.error).toBe("A machine with this code already exists");
  });
});

describe("deleteMachine action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const result = await deleteMachine(1);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    const result = await deleteMachine(1);

    expect(result.error).toBe("Only administrators can delete machines");
  });

  it("should return error for non-existent machine", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue(undefined);

    const result = await deleteMachine(999);

    expect(result.error).toBe("Machine not found");
  });

  it("should prevent deletion of machine with tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tickets: [{ id: 1 }], // Has tickets
    } as unknown as Awaited<ReturnType<typeof db.query.machines.findFirst>>);

    const result = await deleteMachine(1);

    expect(result.error).toBe("Cannot delete machine with existing tickets");
  });

  it("should delete machine successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tickets: [], // No tickets
    } as unknown as Awaited<ReturnType<typeof db.query.machines.findFirst>>);

    vi.mocked(db.delete as unknown as () => unknown).mockReturnValue({
      where: vi.fn(),
    } as unknown);

    const result = await deleteMachine(1);

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });
});
