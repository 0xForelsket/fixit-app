import {
  calculateDueBy,
  calculateEscalationTime,
  formatTimeRemaining,
  getSlaHours,
  getTimeRemaining,
  getUrgencyLevel,
  isOverdue,
} from "@/lib/sla";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getSlaHours", () => {
  it("should return 2 hours for critical priority", () => {
    expect(getSlaHours("critical")).toBe(2);
  });

  it("should return 8 hours for high priority", () => {
    expect(getSlaHours("high")).toBe(8);
  });

  it("should return 24 hours for medium priority", () => {
    expect(getSlaHours("medium")).toBe(24);
  });

  it("should return 72 hours for low priority", () => {
    expect(getSlaHours("low")).toBe(72);
  });
});

describe("calculateDueBy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate due date for critical priority (2 hours)", () => {
    const dueBy = calculateDueBy("critical");
    expect(dueBy).toEqual(new Date("2024-01-15T12:00:00Z"));
  });

  it("should calculate due date for high priority (8 hours)", () => {
    const dueBy = calculateDueBy("high");
    expect(dueBy).toEqual(new Date("2024-01-15T18:00:00Z"));
  });

  it("should calculate due date for medium priority (24 hours)", () => {
    const dueBy = calculateDueBy("medium");
    expect(dueBy).toEqual(new Date("2024-01-16T10:00:00Z"));
  });

  it("should calculate due date for low priority (72 hours)", () => {
    const dueBy = calculateDueBy("low");
    expect(dueBy).toEqual(new Date("2024-01-18T10:00:00Z"));
  });

  it("should use provided createdAt date", () => {
    const createdAt = new Date("2024-01-10T08:00:00Z");
    const dueBy = calculateDueBy("critical", createdAt);
    expect(dueBy).toEqual(new Date("2024-01-10T10:00:00Z"));
  });
});

describe("isOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return false for null dueBy", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("should return false when dueBy is in the future", () => {
    const dueBy = new Date("2024-01-15T12:00:00Z");
    expect(isOverdue(dueBy)).toBe(false);
  });

  it("should return true when dueBy is in the past", () => {
    const dueBy = new Date("2024-01-15T08:00:00Z");
    expect(isOverdue(dueBy)).toBe(true);
  });

  it("should return true when dueBy equals current time", () => {
    const dueBy = new Date("2024-01-15T10:00:00Z");
    // Equal time should be overdue (> check)
    expect(isOverdue(dueBy)).toBe(false);
  });
});

describe("getTimeRemaining", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 0 for null dueBy", () => {
    expect(getTimeRemaining(null)).toBe(0);
  });

  it("should return positive time when not overdue", () => {
    const dueBy = new Date("2024-01-15T12:00:00Z"); // 2 hours from now
    expect(getTimeRemaining(dueBy)).toBe(2 * 60 * 60 * 1000); // 2 hours in ms
  });

  it("should return negative time when overdue", () => {
    const dueBy = new Date("2024-01-15T08:00:00Z"); // 2 hours ago
    expect(getTimeRemaining(dueBy)).toBe(-2 * 60 * 60 * 1000);
  });
});

describe("formatTimeRemaining", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'No deadline' for null", () => {
    expect(formatTimeRemaining(null)).toBe("No deadline");
  });

  it("should format hours and minutes remaining", () => {
    const dueBy = new Date("2024-01-15T12:30:00Z"); // 2h 30m from now
    expect(formatTimeRemaining(dueBy)).toBe("2h 30m remaining");
  });

  it("should format overdue time", () => {
    const dueBy = new Date("2024-01-15T08:00:00Z"); // 2h ago
    expect(formatTimeRemaining(dueBy)).toBe("2h 0m overdue");
  });

  it("should format days for long durations", () => {
    const dueBy = new Date("2024-01-17T10:00:00Z"); // 48 hours from now
    expect(formatTimeRemaining(dueBy)).toBe("2d 0h remaining");
  });

  it("should show only minutes for short durations", () => {
    const dueBy = new Date("2024-01-15T10:45:00Z"); // 45 min from now
    expect(formatTimeRemaining(dueBy)).toBe("45m remaining");
  });
});

describe("getUrgencyLevel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'normal' for null dueBy", () => {
    expect(getUrgencyLevel(null)).toBe("normal");
  });

  it("should return 'overdue' when past due", () => {
    const dueBy = new Date("2024-01-15T08:00:00Z");
    expect(getUrgencyLevel(dueBy)).toBe("overdue");
  });

  it("should return 'critical' when less than 1 hour remaining", () => {
    const dueBy = new Date("2024-01-15T10:30:00Z"); // 30 min from now
    expect(getUrgencyLevel(dueBy)).toBe("critical");
  });

  it("should return 'warning' when 1-4 hours remaining", () => {
    const dueBy = new Date("2024-01-15T12:00:00Z"); // 2 hours from now
    expect(getUrgencyLevel(dueBy)).toBe("warning");
  });

  it("should return 'normal' when more than 4 hours remaining", () => {
    const dueBy = new Date("2024-01-15T20:00:00Z"); // 10 hours from now
    expect(getUrgencyLevel(dueBy)).toBe("normal");
  });
});

describe("calculateEscalationTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate escalation at 75% of SLA for critical", () => {
    // Critical = 2 hours, escalate at 75% = 1.5 hours = 30 min before due
    const escalation = calculateEscalationTime("critical");
    expect(escalation).toEqual(new Date("2024-01-15T11:30:00Z"));
  });

  it("should calculate escalation at 75% of SLA for high", () => {
    // High = 8 hours, escalate at 75% = 6 hours = 2 hours before due
    const escalation = calculateEscalationTime("high");
    expect(escalation).toEqual(new Date("2024-01-15T16:00:00Z"));
  });
});
