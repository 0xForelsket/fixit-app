import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/db", () => ({
  db: {
    query: {
      workOrders: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  userHasPermission: vi.fn(),
  PERMISSIONS: {
    REPORTS_EXPORT: "reports:export",
  },
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

import { GET } from "@/app/(app)/api/reports/export/route";
import { db } from "@/db";
import { userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { NextRequest } from "next/server";

describe("GET /api/reports/export", () => {
  const mockUser = {
    id: "1", displayId: 1,
    employeeId: "ADMIN-001",
    name: "Admin User",
    roleName: "admin",
    roleId: "1",
    sessionVersion: 1,
    permissions: ["*"],
  };

  const mockWorkOrders = [
    {
      id: "1", displayId: 1,
      title: "Fix conveyor belt",
      description: "Belt is slipping",
      type: "breakdown" as const,
      priority: "high" as const,
      status: "open" as const,
      equipmentId: "1",
      reportedById: "1",
      assignedToId: "2",
      departmentId: "1",
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      resolvedAt: null,
      escalatedAt: null,
      dueBy: null,
      resolutionNotes: null,
      equipment: {
        id: "1", displayId: 1,
        name: "Conveyor Belt A",
        location: { id: "1", displayId: 1, name: "Assembly Line 1" },
      },
      reportedBy: { id: "1", displayId: 1, name: "John Doe" },
      assignedTo: { id: "2", displayId: 2, name: "Jane Smith" },
    },
    {
      id: "2", displayId: 2,
      title: "Replace motor, check oil",
      description: 'Description with "quotes" and commas, here',
      type: "maintenance" as const,
      priority: "medium" as const,
      status: "resolved" as const,
      equipmentId: "2",
      reportedById: "1",
      assignedToId: null,
      departmentId: "1",
      createdAt: new Date("2024-01-10T08:00:00Z"),
      updatedAt: new Date("2024-01-10T08:00:00Z"),
      resolvedAt: new Date("2024-01-12T14:00:00Z"),
      escalatedAt: null,
      dueBy: null,
      resolutionNotes: "Motor replaced successfully",
      equipment: null,
      reportedBy: null,
      assignedTo: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL("http://localhost/api/reports/export");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
  });

  it("returns 401 when lacking reports:export permission", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(false);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
  });

  it("returns CSV file with proper headers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain(".csv");
  });

  it("includes CSV column headers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

    const response = await GET(createRequest());
    const csv = await response.text();

    expect(csv).toContain("ID");
    expect(csv).toContain("Title");
    expect(csv).toContain("Description");
    expect(csv).toContain("Equipment");
    expect(csv).toContain("Location");
    expect(csv).toContain("Priority");
    expect(csv).toContain("Status");
  });

  it("exports work order data correctly", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    expect(csv).toContain("Fix conveyor belt");
    expect(csv).toContain("Conveyor Belt A");
    expect(csv).toContain("Assembly Line 1");
    expect(csv).toContain("John Doe");
    expect(csv).toContain("Jane Smith");
  });

  it("escapes CSV special characters", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    // Values with commas and quotes should be escaped
    expect(csv).toContain('"Description with ""quotes"" and commas, here"');
  });

  it("handles null equipment gracefully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    // Should not throw, should have empty values
    expect(response.status).toBe(200);
    expect(csv.split("\n").length).toBeGreaterThan(1);
  });

  describe("Filtering", () => {
    it("filters by status", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(userHasPermission).mockReturnValue(true);
      vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

      await GET(createRequest({ status: "open" }));

      expect(db.query.workOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });

    it("filters by priority", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(userHasPermission).mockReturnValue(true);
      vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

      await GET(createRequest({ priority: "critical" }));

      expect(db.query.workOrders.findMany).toHaveBeenCalled();
    });

    it("filters by date range", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(userHasPermission).mockReturnValue(true);
      vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

      await GET(
        createRequest({
          from: "2024-01-01",
          to: "2024-01-31",
        })
      );

      expect(db.query.workOrders.findMany).toHaveBeenCalled();
    });

    it("ignores status=all filter", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(userHasPermission).mockReturnValue(true);
      vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

      await GET(createRequest({ status: "all" }));

      // Should be called without status filter when "all"
      expect(db.query.workOrders.findMany).toHaveBeenCalled();
    });

    it("ignores priority=all filter", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(userHasPermission).mockReturnValue(true);
      vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

      await GET(createRequest({ priority: "all" }));

      expect(db.query.workOrders.findMany).toHaveBeenCalled();
    });
  });

  it("includes related data in query", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue([]);

    await GET(createRequest());

    expect(db.query.workOrders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        with: {
          equipment: { with: { location: true } },
          reportedBy: true,
          assignedTo: true,
        },
      })
    );
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockRejectedValue(
      new Error("Database error")
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
  });

  it("formats dates correctly in CSV", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
    vi.mocked(db.query.workOrders.findMany).mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    // Date format should be YYYY-MM-DD HH:MM:SS
    expect(csv).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  });
});
