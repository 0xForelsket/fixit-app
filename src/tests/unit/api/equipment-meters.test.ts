import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockFindFirst = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
  }),
}));
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere.mockReturnValue({
      returning: mockUpdateReturning,
    }),
  }),
}));

const mockRequireAuth = vi.fn();
const mockRequireCsrf = vi.fn();
const mockRequirePermission = vi.fn();

const mockCheckRateLimit = vi.fn(() => ({
  success: true,
  remaining: 99,
  reset: Date.now() + 60000,
}));
const mockGetClientIp = vi.fn(() => "127.0.0.1");

const mockApiLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

// Mock modules
vi.vi.fn("@/db", () => ({
  db: {
    query: {
      equipmentMeters: { findFirst: mockFindFirst },
    },
    insert: mockInsert,
    update: mockUpdate,
  },
}));

vi.vi.fn("@/lib/session", () => ({
  getCurrentUser: mockRequireAuth,
  requireAuth: mockRequireAuth,
  requireCsrf: mockRequireCsrf,
  requirePermission: mockRequirePermission,
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
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

// Dynamic imports after mock.module
const { POST } = await import(
  "@/app/(app)/api/equipment/meters/[meterId]/readings/route"
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

describe("POST /api/equipment/meters/[meterId]/readings", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockInsertReturning.mockClear();
    mockUpdate.mockClear();
    mockUpdateSet.mockClear();
    mockUpdateWhere.mockClear();
    mockUpdateReturning.mockClear();
    mockRequireCsrf.mockClear();
    mockRequirePermission.mockClear();
    mockCheckRateLimit.mockClear();
    mockApiLogger.error.mockClear();

    // Reset chains
    mockInsert.mockReturnValue({
      values: mockInsertValues.mockReturnValue({
        returning: mockInsertReturning,
      }),
    });
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

    const request = new Request("http://localhost/api/equipment/meters/meter-1/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading: 15000 }),
    });

    const response = await POST(request, { params: Promise.resolve({ meterId: "meter-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 when meter not found", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve(null));

    const request = new Request("http://localhost/api/equipment/meters/nonexistent/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading: 15000 }),
    });

    const response = await POST(request, { params: Promise.resolve({ meterId: "nonexistent" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 for negative reading", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve({ id: "meter-1", name: "Odometer", unit: "km" }));

    const request = new Request("http://localhost/api/equipment/meters/meter-1/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading: -100 }),
    });

    const response = await POST(request, { params: Promise.resolve({ meterId: "meter-1" }) });
    expect(response.status).toBe(400);
  });

  it("creates reading and updates meter successfully", async () => {
    const now = new Date();
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve({
      id: "meter-1",
      name: "Odometer",
      unit: "km",
      currentReading: "10000",
    }));
    mockInsertReturning.mockImplementation(() => Promise.resolve([
      {
        id: "reading-1",
        meterId: "meter-1",
        reading: "15000",
        recordedAt: now,
        recordedById: "user-1",
      },
    ]));
    mockUpdateReturning.mockImplementation(() => Promise.resolve([
      {
        id: "meter-1",
        currentReading: "15000",
        lastReadingDate: now,
      },
    ]));

    const request = new Request("http://localhost/api/equipment/meters/meter-1/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reading: 15000,
        notes: "Regular check",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ meterId: "meter-1" }) });
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.data.reading).toBeDefined();
  });

  it("accepts reading with optional notes", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve({
      id: "meter-1",
      name: "Odometer",
      unit: "km",
    }));
    mockInsertReturning.mockImplementation(() => Promise.resolve([
      {
        id: "reading-1",
        meterId: "meter-1",
        reading: "20000",
        notes: null,
        recordedAt: new Date(),
        recordedById: "user-1",
      },
    ]));
    mockUpdateReturning.mockImplementation(() => Promise.resolve([
      {
        id: "meter-1",
        currentReading: "20000",
      },
    ]));

    const request = new Request("http://localhost/api/equipment/meters/meter-1/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading: 20000 }), // No notes
    });

    const response = await POST(request, { params: Promise.resolve({ meterId: "meter-1" }) });
    expect(response.status).toBe(201);
  });
});
