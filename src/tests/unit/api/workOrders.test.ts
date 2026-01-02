import { beforeEach, describe, expect, it, mock } from "bun:test";

// Create mocks
const mockWorkOrdersFindMany = mock();
const mockEquipmentFindFirst = mock();
const mockUsersFindMany = mock();

const mockInsertValues = mock();
const mockInsertReturning = mock();
const mockInsert = mock(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
  }),
}));

const mockSelectFrom = mock();
const mockSelectWhere = mock();
const mockSelect = mock(() => ({
  from: mockSelectFrom.mockReturnValue({
    where: mockSelectWhere,
  }),
}));

const mockRequireAuth = mock();
const mockRequireCsrf = mock();
const mockGetCurrentUser = mock();

const mockCheckRateLimit = mock(() => ({
  success: true,
  remaining: 99,
  reset: Date.now() + 60000,
}));
const mockGetClientIp = mock(() => "127.0.0.1");

// Mock modules
mock.module("@/db", () => ({
  db: {
    query: {
      workOrders: { findMany: mockWorkOrdersFindMany },
      equipment: { findFirst: mockEquipmentFindFirst },
      users: { findMany: mockUsersFindMany },
    },
    insert: mockInsert,
    select: mockSelect,
  },
}));

mock.module("@/lib/session", () => ({
  requireAuth: mockRequireAuth,
  requireCsrf: mockRequireCsrf,
  getCurrentUser: mockGetCurrentUser,
}));

mock.module("@/lib/auth", () => ({
  userHasPermission: mock(() => true),
  PERMISSIONS: {
    TICKET_VIEW_ALL: "ticket:view_all",
    TICKET_CREATE: "ticket:create",
    TICKET_VIEW: "ticket:view",
  },
}));

mock.module("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    login: { limit: 5, windowMs: 60000 },
    api: { limit: 100, windowMs: 60000 },
    upload: { limit: 10, windowMs: 60000 },
  },
}));

mock.module("@/lib/logger", () => ({
  apiLogger: {
    error: mock(),
    info: mock(),
    warn: mock(),
  },
  generateRequestId: mock(() => "test-request-id"),
}));

// Dynamic imports after mock.module
const { GET, POST } = await import("@/app/(app)/api/work-orders/route");

describe("GET /api/work-orders", () => {
  beforeEach(() => {
    mockWorkOrdersFindMany.mockClear();
    mockEquipmentFindFirst.mockClear();
    mockUsersFindMany.mockClear();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockInsertReturning.mockClear();
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockSelectWhere.mockClear();
    mockRequireAuth.mockClear();
    mockRequireCsrf.mockClear();
    mockGetCurrentUser.mockClear();
    mockCheckRateLimit.mockClear();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/work-orders");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/work-orders", () => {
  beforeEach(() => {
    mockWorkOrdersFindMany.mockClear();
    mockEquipmentFindFirst.mockClear();
    mockUsersFindMany.mockClear();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockInsertReturning.mockClear();
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockSelectWhere.mockClear();
    mockRequireAuth.mockClear();
    mockRequireCsrf.mockClear();
    mockGetCurrentUser.mockClear();
    mockCheckRateLimit.mockClear();
    
    // Reset chains
    mockInsert.mockReturnValue({
      values: mockInsertValues.mockReturnValue({
        returning: mockInsertReturning,
      }),
    });
    mockSelect.mockReturnValue({
      from: mockSelectFrom.mockReturnValue({
        where: mockSelectWhere,
      }),
    });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  it("returns 403 when CSRF token missing", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockRejectedValue(new Error("CSRF token missing"));

    const request = new Request("http://localhost/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid input", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockResolvedValue(undefined);
    const mockUser = {
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Test User",
      roleId: "2",
      roleName: "tech",
      departmentId: "1",
      sessionVersion: 1,
      permissions: ["ticket:create", "ticket:view"],
      hourlyRate: 25.0,
    };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new Request("http://localhost/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: "invalid" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });
});
