import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockWorkOrdersFindMany = vi.fn();
const mockEquipmentFindFirst = vi.fn();
const mockUsersFindMany = vi.fn();

const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
  }),
}));

const mockSelectFrom = vi.fn();
const mockSelectWhere = vi.fn();
const mockSelect = vi.fn(() => ({
  from: mockSelectFrom.mockReturnValue({
    where: mockSelectWhere,
  }),
}));

const mockRequireAuth = vi.fn();
const mockRequireCsrf = vi.fn();
const mockGetCurrentUser = vi.fn();

const mockCheckRateLimit = vi.fn(() => ({
  success: true,
  remaining: 99,
  reset: Date.now() + 60000,
}));
const mockGetClientIp = vi.fn(() => "127.0.0.1");

// Mock modules
vi.vi.fn("@/db", () => ({
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

vi.vi.fn("@/lib/session", () => ({
  requireAuth: mockRequireAuth,
  requireCsrf: mockRequireCsrf,
  getCurrentUser: mockGetCurrentUser,
}));

vi.vi.fn("@/lib/auth", () => ({
  userHasPermission: vi.fn(() => true),
  PERMISSIONS: {
    TICKET_VIEW_ALL: "ticket:view_all",
    TICKET_CREATE: "ticket:create",
    TICKET_VIEW: "ticket:view",
  },
}));

vi.vi.fn("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    login: { limit: 5, windowMs: 60000 },
    api: { limit: 100, windowMs: 60000 },
    upload: { limit: 10, windowMs: 60000 },
  },
}));

vi.vi.fn("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
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
