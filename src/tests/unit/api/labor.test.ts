import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      laborLogs: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { GET, POST } from "@/app/(app)/api/labor/route";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("GET /api/labor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/labor");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns labor logs when authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const mockLogs = [
      {
        id: 1,
        workOrderId: 5,
        userId: 1,
        startTime: new Date(),
        endTime: new Date(),
        durationMinutes: 60,
        hourlyRate: 50,
        isBillable: true,
        notes: "Some notes",
        createdAt: new Date(),
        user: { id: 1, name: "Tech" },
        workOrder: { id: 5, title: "Fix machine" },
      },
    ];

    vi.mocked(db.query.laborLogs.findMany).mockResolvedValue(mockLogs);

    const request = new Request("http://localhost/api/labor");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].durationMinutes).toBe(60);
  });

  it("filters by workOrderId when provided", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    vi.mocked(db.query.laborLogs.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost/api/labor?workOrderId=5");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(db.query.laborLogs.findMany).toHaveBeenCalled();
  });
});

describe("POST /api/labor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: 1,
        userId: 1,
        durationMinutes: 60,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when missing required fields", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: 1,
        // Missing userId and durationMinutes
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("creates labor log successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const mockLog = {
      id: 1,
      workOrderId: 5,
      userId: 1,
      durationMinutes: 90,
      hourlyRate: 50,
      isBillable: true,
      startTime: new Date(),
      endTime: null,
      notes: "Fixed the issue",
      createdAt: new Date(),
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockLog]),
      })),
    } as unknown as ReturnType<typeof db.insert>);

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: 5,
        userId: 1,
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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    let capturedValues: unknown;
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn((vals) => {
        capturedValues = vals;
        return {
          returning: vi.fn().mockResolvedValue([{ id: 1, isBillable: true }]),
        };
      }),
    } as unknown as ReturnType<typeof db.insert>);

    const request = new Request("http://localhost/api/labor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: 5,
        userId: 1,
        durationMinutes: 60,
      }),
    });

    await POST(request);

    expect((capturedValues as Record<string, unknown>).isBillable).toBe(true);
  });
});
