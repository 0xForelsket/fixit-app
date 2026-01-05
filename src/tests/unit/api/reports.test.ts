import { beforeEach, describe, expect, it,vi } from "vitest";
import { NextRequest } from "next/server";

// Create mocks
const mockFindMany = vi.fn();

const mockGetCurrentUser = vi.fn();

const mockUserHasPermission = vi.fn();

const mockApiLogger = {
  error: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

// Mock modules
vi.mock("@/db", () => ({
  db: {
    query: {
      workOrders: {
        findMany: mockFindMany,
      },
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    REPORTS_EXPORT: "reports:export",
  },
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

// Dynamic imports after mock.module
const { GET } = await import("@/app/(app)/api/reports/export/route");

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
    mockFindMany.mockClear();
    mockGetCurrentUser.mockClear();
    mockUserHasPermission.mockClear();
    mockApiLogger.error.mockClear();
    mockApiLogger.info.mockClear();
    mockGenerateRequestId.mockClear();
  });

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL("http://localhost/api/reports/export");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return new NextRequest(url);
  }

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
  });

  it("returns 401 when lacking reports:export permission", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(false);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
  });

  it("returns CSV file with proper headers", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain(".csv");
  });

  it("includes CSV column headers", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue([]);

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
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    expect(csv).toContain("Fix conveyor belt");
    expect(csv).toContain("Conveyor Belt A");
    expect(csv).toContain("Assembly Line 1");
    expect(csv).toContain("John Doe");
    expect(csv).toContain("Jane Smith");
  });

  it("escapes CSV special characters", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    // Values with commas and quotes should be escaped
    expect(csv).toContain('"Description with ""quotes"" and commas, here"');
  });

  it("handles null equipment gracefully", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    // Should not throw, should have empty values
    expect(response.status).toBe(200);
    expect(csv.split("\n").length).toBeGreaterThan(1);
  });

  describe("Filtering", () => {
    it("filters by status", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserHasPermission.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      await GET(createRequest({ status: "open" }));

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });

    it("filters by priority", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserHasPermission.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      await GET(createRequest({ priority: "critical" }));

      expect(mockFindMany).toHaveBeenCalled();
    });

    it("filters by date range", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserHasPermission.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      await GET(
        createRequest({
          from: "2024-01-01",
          to: "2024-01-31",
        })
      );

      expect(mockFindMany).toHaveBeenCalled();
    });

    it("ignores status=all filter", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserHasPermission.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      await GET(createRequest({ status: "all" }));

      // Should be called without status filter when "all"
      expect(mockFindMany).toHaveBeenCalled();
    });

    it("ignores priority=all filter", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserHasPermission.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      await GET(createRequest({ priority: "all" }));

      expect(mockFindMany).toHaveBeenCalled();
    });
  });

  it("includes related data in query", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue([]);

    await GET(createRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
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
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockRejectedValue(
      new Error("Database error")
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
  });

  it("formats dates correctly in CSV", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
    mockFindMany.mockResolvedValue(mockWorkOrders);

    const response = await GET(createRequest());
    const csv = await response.text();

    // Date format should be YYYY-MM-DD HH:MM:SS
    expect(csv).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  });
});
