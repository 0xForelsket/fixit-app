import { beforeEach, describe, expect, it, vi } from "vitest";

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
      equipmentMeters: { findFirst: mockFindFirst },
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

    const request = new Request(
      "http://localhost/api/equipment/meters/meter-1/readings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading: 15000 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ meterId: "meter-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when meter not found", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() => Promise.resolve(null));

    const request = new Request(
      "http://localhost/api/equipment/meters/nonexistent/readings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading: 15000 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ meterId: "nonexistent" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 for negative reading", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() =>
      Promise.resolve({ id: "meter-1", name: "Odometer", unit: "km" })
    );

    const request = new Request(
      "http://localhost/api/equipment/meters/meter-1/readings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading: -100 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ meterId: "meter-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("creates reading and updates meter successfully", async () => {
    const now = new Date();
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() =>
      Promise.resolve({
        id: "meter-1",
        name: "Odometer",
        unit: "km",
        currentReading: "10000",
      })
    );
    mockInsertReturning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "reading-1",
          meterId: "meter-1",
          reading: "15000",
          recordedAt: now,
          recordedById: "user-1",
        },
      ])
    );
    mockUpdateReturning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "meter-1",
          currentReading: "15000",
          lastReadingDate: now,
        },
      ])
    );

    const request = new Request(
      "http://localhost/api/equipment/meters/meter-1/readings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading: 15000,
          notes: "Regular check",
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ meterId: "meter-1" }),
    });
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.data.reading).toBeDefined();
  });

  it("accepts reading with optional notes", async () => {
    mockRequireCsrf.mockImplementation(() => Promise.resolve(undefined));
    mockRequirePermission.mockImplementation(() => Promise.resolve(mockUser));
    mockFindFirst.mockImplementation(() =>
      Promise.resolve({
        id: "meter-1",
        name: "Odometer",
        unit: "km",
      })
    );
    mockInsertReturning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "reading-1",
          meterId: "meter-1",
          reading: "20000",
          notes: null,
          recordedAt: new Date(),
          recordedById: "user-1",
        },
      ])
    );
    mockUpdateReturning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "meter-1",
          currentReading: "20000",
        },
      ])
    );

    const request = new Request(
      "http://localhost/api/equipment/meters/meter-1/readings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading: 20000 }), // No notes
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ meterId: "meter-1" }),
    });
    expect(response.status).toBe(201);
  });
});
