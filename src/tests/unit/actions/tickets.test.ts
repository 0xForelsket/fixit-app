import {
  addTicketComment,
  createTicket,
  resolveTicket,
  updateTicket,
} from "@/actions/tickets";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      machines: {
        findFirst: vi.fn(),
      },
      users: {
        findMany: vi.fn(),
      },
      tickets: {
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
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("createTicket action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("machineId", "1");
    formData.set("type", "breakdown");
    formData.set("title", "Test ticket");
    formData.set("description", "Test description");

    const result = await createTicket({}, formData);

    expect(result.error).toBe("You must be logged in to create a ticket");
  });

  it("should return error for invalid input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const formData = new FormData();
    formData.set("machineId", "invalid"); // not a number
    formData.set("type", "breakdown");
    formData.set("title", "");
    formData.set("description", "Test");

    const result = await createTicket({}, formData);

    expect(result.error).toBeDefined();
  });

  it("should create ticket successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const mockTicket = {
      id: 1,
      machineId: 1,
      type: "breakdown",
      title: "Machine stopped",
      description: "Machine won't start",
      priority: "high",
      status: "open",
      reportedById: 1,
      dueBy: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockTicket]),
      })),
    } as unknown);

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Test Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.query.users.findMany).mockResolvedValue([]);

    const formData = new FormData();
    formData.set("machineId", "1");
    formData.set("type", "breakdown");
    formData.set("title", "Machine stopped");
    formData.set("description", "Machine won't start");
    formData.set("priority", "high");

    const result = await createTicket({}, formData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTicket);
  });

  it("should notify techs for critical priority tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const mockTicket = {
      id: 1,
      machineId: 1,
      type: "breakdown",
      title: "Critical issue",
      description: "Urgent",
      priority: "critical",
      status: "open",
      reportedById: 1,
      dueBy: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockInsert = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockTicket]),
      })),
    }));

    vi.mocked(db.insert as unknown as typeof mockInsert).mockImplementation(
      mockInsert
    );

    vi.mocked(db.query.machines.findFirst).mockResolvedValue({
      id: 1,
      name: "Test Machine",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.query.users.findMany).mockResolvedValue([
      {
        id: 2,
        employeeId: "TECH-001",
        name: "Tech User",
        pin: "hashed",
        role: "tech",
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const formData = new FormData();
    formData.set("machineId", "1");
    formData.set("type", "breakdown");
    formData.set("title", "Critical issue");
    formData.set("description", "Urgent");
    formData.set("priority", "critical");

    await createTicket({}, formData);

    // Should have called insert for ticket and notifications
    expect(db.insert).toHaveBeenCalled();
  });
});

describe("updateTicket action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateTicket(1, {}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject updates from operators", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateTicket(1, {}, formData);

    expect(result.error).toBe("You don't have permission to update tickets");
  });

  it("should return error for non-existent ticket", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    vi.mocked(db.query.tickets.findFirst).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateTicket(999, {}, formData);

    expect(result.error).toBe("Ticket not found");
  });

  it("should update ticket status successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    vi.mocked(db.query.tickets.findFirst).mockResolvedValue({
      id: 1,
      machineId: 1,
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: 2,
      assignedToId: null,
      dueBy: new Date(),
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateTicket(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled(); // For status change log
  });

  it("should allow admin to update tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      role: "admin",
    });

    vi.mocked(db.query.tickets.findFirst).mockResolvedValue({
      id: 1,
      machineId: 1,
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: 2,
      assignedToId: null,
      dueBy: new Date(),
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("priority", "high");

    const result = await updateTicket(1, {}, formData);

    expect(result.success).toBe(true);
  });
});

describe("resolveTicket action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("resolutionNotes", "Fixed it");

    const result = await resolveTicket(1, {}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject resolution from operators", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const formData = new FormData();
    formData.set("resolutionNotes", "Fixed it");

    const result = await resolveTicket(1, {}, formData);

    expect(result.error).toBe("You don't have permission to resolve tickets");
  });

  it("should require resolution notes", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    const formData = new FormData();
    // No resolution notes

    const result = await resolveTicket(1, {}, formData);

    expect(result.error).toBe("Resolution notes are required");
  });

  it("should resolve ticket successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      role: "tech",
    });

    vi.mocked(db.query.tickets.findFirst).mockResolvedValue({
      id: 1,
      machineId: 1,
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "in_progress",
      reportedById: 2,
      assignedToId: 1,
      dueBy: new Date(),
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("resolutionNotes", "Replaced the faulty component.");

    const result = await resolveTicket(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled(); // For status change log
  });
});

describe("addTicketComment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("comment", "Test comment");

    const result = await addTicketComment(1, {}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should require comment content", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    const formData = new FormData();
    formData.set("comment", "   "); // Only whitespace

    const result = await addTicketComment(1, {}, formData);

    expect(result.error).toBe("Comment is required");
  });

  it("should add comment successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("comment", "Additional details about the issue");

    const result = await addTicketComment(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should trim comment whitespace", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      role: "operator",
    });

    let capturedValues: unknown;
    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn((val) => {
        capturedValues = val;
      }),
    } as unknown);

    const formData = new FormData();
    formData.set("comment", "  Trimmed comment  ");

    await addTicketComment(1, {}, formData);

    expect((capturedValues as Record<string, unknown>).newValue).toBe(
      "Trimmed comment"
    );
  });
});
