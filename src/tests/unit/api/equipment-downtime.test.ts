import { beforeEach, describe, expect, it,vi } from "vitest";

// Create mocks
const {
  mockFindFirst,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
  mockUpdateSet,
  mockUpdateWhere,
  mockUpdateReturning,
  mockUpdate,
  mockRequireAuth,
  mockRequireCsrf,
  mockRequirePermission,
  mockCheckRateLimit,
  mockGetClientIp,
  mockLoggerError,
  mockLoggerWarn,
  mockLoggerInfo,
  mockGenerateRequestId,
} = vi.hoisted(() => {
  const mFindFirst = vi.fn();
  const mInsertValues = vi.fn();
  const mInsertReturning = vi.fn();
  const mInsert = vi.fn(() => ({
    values: mInsertValues.mockReturnValue({
      returning: mInsertReturning,
    }),
  }));
  const mUpdateSet = vi.fn();
  const mUpdateWhere = vi.fn();
  const mUpdateReturning = vi.fn();
  const mUpdate = vi.fn(() => ({
    set: mUpdateSet.mockReturnValue({
      where: mUpdateWhere.mockReturnValue({
        returning: mUpdateReturning,
      }),
    }),
  }));

  return {
    mockFindFirst: mFindFirst,
    mockInsertValues: mInsertValues,
    mockInsertReturning: mInsertReturning,
    mockInsert: mInsert,
    mockUpdateSet: mUpdateSet,
    mockUpdateWhere: mUpdateWhere,
    mockUpdateReturning: mUpdateReturning,
    mockUpdate: mUpdate,
    mockRequireAuth: vi.fn(),
    mockRequireCsrf: vi.fn(),
    mockRequirePermission: vi.fn(),
    mockCheckRateLimit: vi.fn(() => ({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    })),
    mockGetClientIp: vi.fn(() => "127.0.0.1"),
    mockLoggerError: vi.fn(),
    mockLoggerWarn: vi.fn(),
    mockLoggerInfo: vi.fn(),
    mockGenerateRequestId: vi.fn(() => "test-request-id"),
  };
});

const mockApiLogger = {
  error: mockLoggerError,
  warn: mockLoggerWarn,
  info: mockLoggerInfo,
};

// Mock modules
vi.mock("@/db", () => ({
  db: {
    query: {
      equipment: { findFirst: mockFindFirst },
      downtimeLogs: { findFirst: mockFindFirst },
    },
    insert: mockInsert,
    update: mockUpdate,
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mockRequireAuth,
  requireAuth: mockRequireAuth,
  requireCsrf: mockRequireCsrf,
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    login: { limit: 5, windowMs: 60000 },
    api: { limit: 100, windowMs: 60000 },
    upload: { limit: 10, windowMs: 60000 },
  },
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

// Dynamic imports after mock.module
const { POST } = await import("@/app/(app)/api/equipment/[id]/downtime/route");
const { PATCH } = await import(
  "@/app/(app)/api/equipment/downtime/[downtimeId]/route"
);

const mockUser = {
  id: "user-1",
  displayId: 1,
  name: "Admin",
  employeeId: "ADMIN-001",
  roleName: "admin",
  roleId: "role-3",
  sessionVersion: 1,
  permissions: ["*"],
};

describe("POST /api/equipment/[id]/downtime", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockInsertReturning.mockClear();
    mockRequireCsrf.mockClear();
    mockRequirePermission.mockClear();
    mockCheckRateLimit.mockClear();
    mockApiLogger.error.mockClear();
    mockRequireAuth.mockClear();

    // Default authenticated state
    mockRequireAuth.mockResolvedValue(mockUser);
    mockRequirePermission.mockResolvedValue(mockUser);

    // Reset chains
    mockInsert.mockReturnValue({
      values: mockInsertValues.mockReturnValue({
        returning: mockInsertReturning,
      }),
    });

    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/equip-1/downtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reasonCode: "mechanical_failure",
        startTime: new Date().toISOString(),
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "equip-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 when equipment not found", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve(null));

    const request = new Request("http://localhost/api/equipment/nonexistent/downtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reasonCode: "mechanical_failure",
        startTime: new Date().toISOString(),
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid input", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve({ id: "equip-1", name: "Machine A" }));

    const request = new Request("http://localhost/api/equipment/equip-1/downtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reasonCode: "invalid_reason", // Invalid reason code
        startTime: new Date().toISOString(),
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "equip-1" }) });
    expect(response.status).toBe(400);
  });

  it("creates downtime log successfully", async () => {
    const now = new Date();
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve({ id: "equip-1", name: "Machine A" }));
    mockInsertReturning.mockImplementation(() => Promise.resolve([
      {
        id: "downtime-1",
        equipmentId: "equip-1",
        reasonCode: "mechanical_failure",
        startTime: now,
        endTime: null,
        notes: "Motor failure",
        reportedById: "user-1",
      },
    ]));

    const request = new Request("http://localhost/api/equipment/equip-1/downtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reasonCode: "mechanical_failure",
        startTime: now.toISOString(),
        notes: "Motor failure",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "equip-1" }) });
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.data.reasonCode).toBe("mechanical_failure");
  });
});

describe("PATCH /api/equipment/downtime/[downtimeId]", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockUpdate.mockClear();
    mockUpdateSet.mockClear();
    mockUpdateWhere.mockClear();
    mockUpdateReturning.mockClear();
    mockRequireCsrf.mockClear();
    mockRequirePermission.mockClear();
    mockCheckRateLimit.mockClear();

    mockUpdate.mockReturnValue({
      set: mockUpdateSet.mockReturnValue({
        where: mockUpdateWhere.mockReturnValue({
          returning: mockUpdateReturning,
        }),
      }),
    });

    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/downtime/downtime-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ downtimeId: "downtime-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 when downtime log not found", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue(mockUser);
    mockFindFirst.mockResolvedValue(null);

    const request = new Request("http://localhost/api/equipment/downtime/nonexistent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ downtimeId: "nonexistent" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 when downtime already ended", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue(mockUser);
    mockFindFirst.mockResolvedValue({
      id: "downtime-1",
      endTime: new Date(), // Already ended
    });

    const request = new Request("http://localhost/api/equipment/downtime/downtime-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ downtimeId: "downtime-1" }) });
    expect(response.status).toBe(400);
  });

  it("ends ongoing downtime successfully", async () => {
    const now = new Date();
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue(mockUser);
    mockFindFirst.mockResolvedValue({
      id: "downtime-1",
      endTime: null, // Ongoing
    });
    mockUpdateReturning.mockResolvedValue([
      {
        id: "downtime-1",
        endTime: now,
      },
    ]);

    const request = new Request("http://localhost/api/equipment/downtime/downtime-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ downtimeId: "downtime-1" }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.data.endTime).toBeDefined();
  });
});
