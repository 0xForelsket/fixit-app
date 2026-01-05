import {
  cn,
  formatDate,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  getEquipmentStatusColor,
  getPriorityColor,
  getStatusColor,
  truncate,
} from "@/lib/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("should handle undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatDate", () => {
  it("should format Date object", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = formatDate(date);
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it("should format Unix timestamp (seconds)", () => {
    const timestamp = 1705315800; // 2024-01-15T10:30:00Z
    const result = formatDate(timestamp);
    expect(result).toMatch(/Jan 15, 2024/);
  });
});

describe("formatDateTime", () => {
  it("should format date with time", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = formatDateTime(date);
    expect(result).toContain("2024");
    expect(result).toContain("Jan");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'just now' for very recent times", () => {
    const date = new Date("2024-01-15T09:59:30Z"); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe("just now");
  });

  it("should format minutes ago", () => {
    const date = new Date("2024-01-15T09:45:00Z"); // 15 min ago
    expect(formatRelativeTime(date)).toBe("15m ago");
  });

  it("should format hours ago", () => {
    const date = new Date("2024-01-15T07:00:00Z"); // 3 hours ago
    expect(formatRelativeTime(date)).toBe("3h ago");
  });

  it("should format days ago", () => {
    const date = new Date("2024-01-13T10:00:00Z"); // 2 days ago
    expect(formatRelativeTime(date)).toBe("2d ago");
  });

  it("should format older dates as date string", () => {
    const date = new Date("2024-01-01T10:00:00Z"); // 14 days ago
    expect(formatRelativeTime(date)).toMatch(/Jan 1, 2024/);
  });
});

describe("formatDuration", () => {
  it("should format minutes only", () => {
    expect(formatDuration(30 * 60 * 1000)).toBe("30m");
  });

  it("should format hours only", () => {
    expect(formatDuration(2 * 60 * 60 * 1000)).toBe("2h");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(2.5 * 60 * 60 * 1000)).toBe("2h 30m");
  });
});

describe("getPriorityColor", () => {
  it("should return danger color for critical", () => {
    expect(getPriorityColor("critical")).toContain("danger");
  });

  it("should return warning color for high", () => {
    expect(getPriorityColor("high")).toContain("warning");
  });

  it("should return primary color for medium", () => {
    expect(getPriorityColor("medium")).toContain("primary");
  });

  it("should return light color for low", () => {
    expect(getPriorityColor("low")).toContain("primary-1");
  });
});

describe("getStatusColor", () => {
  it("should return appropriate colors for each status", () => {
    expect(getStatusColor("open")).toContain("primary");
    expect(getStatusColor("in_progress")).toContain("warning");
    expect(getStatusColor("resolved")).toContain("success");
    expect(getStatusColor("closed")).toContain("primary");
  });
});

describe("getEquipmentStatusColor", () => {
  it("should return success color for operational", () => {
    expect(getEquipmentStatusColor("operational")).toContain("success");
  });

  it("should return danger color for down", () => {
    expect(getEquipmentStatusColor("down")).toContain("danger");
  });

  it("should return warning color for maintenance", () => {
    expect(getEquipmentStatusColor("maintenance")).toContain("warning");
  });
});

describe("truncate", () => {
  it("should not truncate short text", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("should truncate long text with ellipsis", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
  });

  it("should handle exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});
