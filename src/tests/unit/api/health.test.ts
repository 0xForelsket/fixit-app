import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(),
    })),
  },
}));

import { GET } from "@/app/api/health/route";
import { db } from "@/db";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns healthy status when database is accessible", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ ping: 1 }]),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("ok");
    expect(data.checks.database.latencyMs).toBeDefined();
  });

  it("returns unhealthy status when database is down", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockRejectedValue(new Error("Connection refused")),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("error");
    expect(data.checks.database.error).toContain("Connection refused");
  });

  it("includes timestamp in response", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ ping: 1 }]),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it("includes version in response", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ ping: 1 }]),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBeDefined();
  });

  it("includes uptime in response", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ ping: 1 }]),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(data.uptime).toBeDefined();
    expect(typeof data.uptime).toBe("number");
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("includes memory usage in response", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ ping: 1 }]),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(data.checks.memory).toBeDefined();
    expect(data.checks.memory.heapUsedMB).toBeDefined();
    expect(data.checks.memory.heapTotalMB).toBeDefined();
    expect(data.checks.memory.rssMB).toBeDefined();
  });

  it("returns period in response for KPIs context", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ ping: 1 }]),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    // Health endpoint should not include period (that's for analytics)
    expect(data.period).toBeUndefined();
  });
});
