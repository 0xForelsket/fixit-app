import { beforeEach, describe, expect, it,vi } from "vitest";

// Create mock functions
const mockFrom = vi.fn();
const mockSelect = vi.fn(() => ({ from: mockFrom }));

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
  },
}));

const { GET } = await import("@/app/(app)/api/health/route");

describe("GET /api/health", () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockFrom.mockClear();
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns healthy status when database is accessible", async () => {
    mockFrom.mockResolvedValue([{ ping: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("ok");
    expect(data.checks.database.latencyMs).toBeDefined();
  });

  it("returns unhealthy status when database is down", async () => {
    mockFrom.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("error");
    expect(data.checks.database.error).toContain("Connection refused");
  });

  it("includes timestamp in response", async () => {
    mockFrom.mockResolvedValue([{ ping: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it("includes version in response", async () => {
    mockFrom.mockResolvedValue([{ ping: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBeDefined();
  });

  it("includes uptime in response", async () => {
    mockFrom.mockResolvedValue([{ ping: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.uptime).toBeDefined();
    expect(typeof data.uptime).toBe("number");
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("includes memory usage in response", async () => {
    mockFrom.mockResolvedValue([{ ping: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.checks.memory).toBeDefined();
    expect(data.checks.memory.heapUsedMB).toBeDefined();
    expect(data.checks.memory.heapTotalMB).toBeDefined();
    expect(data.checks.memory.rssMB).toBeDefined();
  });

  it("returns period in response for KPIs context", async () => {
    mockFrom.mockResolvedValue([{ ping: 1 }]);

    const response = await GET();
    const data = await response.json();

    // Health endpoint should not include period (that's for analytics)
    expect(data.period).toBeUndefined();
  });
});
