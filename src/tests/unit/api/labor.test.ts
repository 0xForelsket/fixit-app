import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockFindMany = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
  }),
}));

const mockGetCurrentUser = vi.fn();
const mockRequireCsrf = vi.fn().mockResolvedValue(true);

const mockApiLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

const mockRevalidatePath = vi.fn();

// Mock modules
vi.mock("@/db", () => ({
  db: {
    query: {
      laborLogs: {
        findMany: mockFindMany,
      },
    },
    insert: mockInsert,
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
  requireCsrf: mockRequireCsrf,
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Dynamic imports after mock.module
const { GET, POST } = await import("@/app/(app)/api/labor/route");

beforeEach(() => {
  mockFindMany.mockClear();
  mockInsert.mockClear();
  mockInsertValues.mockClear();
  mockInsertReturning.mockClear();
  mockGetCurrentUser.mockClear();
  mockRequireCsrf.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();
  mockRevalidatePath.mockClear();

  // Reset chains
  mockInsert.mockReturnValue({
    values: mockInsertValues.mockReturnValue({
      returning: mockInsertReturning,
    }),
  });
});

describe("GET /api/labor", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/labor");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns labor logs when authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const mockLogs = [
      {
        id: "1",
        displayId: 1,
        workOrderId: "5",
        userId: "1",
        startTime: new Date(),
        endTime: new Date(),
        durationMinutes: 60,
        hourlyRate: 50,
        isBillable: true,
        notes: "Some notes",
        createdAt: new Date(),
        user: { id: "1", displayId: 1, name: "Tech" },
        workOrder: { id: "5", displayId: 5, title: "Fix machine" },
      },
    ];

    mockFindMany.mockResolvedValue(mockLogs);

    const request = new Request("http://localhost/api/labor");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].durationMinutes).toBe(60);
  });

  it("filters by workOrderId when provided", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockFindMany.mockResolvedValue([]);

    const request = new Request("http://localhost/api/labor?workOrderId=5");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalled();
  });
});

describe("POST /api/labor", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: "1",
        userId: "1",
        durationMinutes: 60,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when missing required fields", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: "1",
        // Missing userId and durationMinutes
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("creates labor log successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const mockLog = {
      id: "1",
      displayId: 1,
      workOrderId: "5",
      userId: "1",
      durationMinutes: 90,
      hourlyRate: 50,
      isBillable: true,
      startTime: new Date(),
      endTime: null,
      notes: "Fixed the issue",
      createdAt: new Date(),
    };

    mockInsertReturning.mockResolvedValue([mockLog]);

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: "5",
        userId: "1",
        durationMinutes: 90,
        hourlyRate: 50,
        notes: "Fixed the issue",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.durationMinutes).toBe(90);
  });

  it("sets isBillable to true by default", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    let capturedValues: any;
    mockInsertValues.mockImplementation((vals: any) => {
      capturedValues = vals;
      return {
        returning: mockInsertReturning.mockResolvedValue([
          { id: "1", displayId: 1, isBillable: true },
        ]),
      };
    });

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: "5",
        userId: "1",
        durationMinutes: 60,
      }),
    });

    await POST(request);

    expect(capturedValues.isBillable).toBe(true);
  });
});
