import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    query: {
      tickets: { findMany: vi.fn() },
      equipment: { findFirst: vi.fn() },
      users: { findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(),
  requireCsrf: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 99,
    reset: Date.now() + 60000,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
  RATE_LIMITS: {
    login: { limit: 5, windowMs: 60000 },
    api: { limit: 100, windowMs: 60000 },
    upload: { limit: 10, windowMs: 60000 },
  },
}));

import { GET, POST } from "@/app/api/tickets/route";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth, requireCsrf } from "@/lib/session";

describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/tickets");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  it("returns 403 when CSRF token missing", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockRejectedValue(new Error("CSRF token missing"));

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid input", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requireAuth).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Test User",
      role: "tech",
    });

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: "invalid" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });
});
