import {
  calculateLockoutEnd,
  hashPin,
  isAccountLocked,
  verifyPin,
} from "@/lib/auth";
import { describe, expect, it } from "bun:test";

describe("hashPin", () => {
  it("should hash a PIN", async () => {
    const pin = "1234";
    const hash = await hashPin(pin);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(pin);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should generate different hashes for same PIN", async () => {
    const pin = "1234";
    const hash1 = await hashPin(pin);
    const hash2 = await hashPin(pin);

    // bcrypt generates different salts, so hashes differ
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPin", () => {
  it("should verify correct PIN", async () => {
    const pin = "1234";
    const hash = await hashPin(pin);

    const result = await verifyPin(pin, hash);
    expect(result).toBe(true);
  });

  it("should reject incorrect PIN", async () => {
    const pin = "1234";
    const hash = await hashPin(pin);

    const result = await verifyPin("5678", hash);
    expect(result).toBe(false);
  });

  it("should handle empty PIN", async () => {
    const hash = await hashPin("1234");
    const result = await verifyPin("", hash);
    expect(result).toBe(false);
  });
});

describe("isAccountLocked", () => {
  it("should return false for null lockedUntil", () => {
    expect(isAccountLocked(null)).toBe(false);
  });

  it("should return false when lockout has expired", () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    expect(isAccountLocked(pastDate)).toBe(false);
  });

  it("should return true when still locked", () => {
    const futureDate = new Date(Date.now() + 60000); // 1 minute from now
    expect(isAccountLocked(futureDate)).toBe(true);
  });
});

describe("calculateLockoutEnd", () => {
  it("should return a date 15 minutes in the future", () => {
    const before = Date.now();
    const lockoutEnd = calculateLockoutEnd();
    const after = Date.now();

    const fifteenMinutes = 15 * 60 * 1000;

    expect(lockoutEnd.getTime()).toBeGreaterThanOrEqual(
      before + fifteenMinutes
    );
    expect(lockoutEnd.getTime()).toBeLessThanOrEqual(after + fifteenMinutes);
  });
});
