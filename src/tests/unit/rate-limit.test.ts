import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Note: Tests use dynamic imports to get fresh module instances

describe("rate-limit", () => {
  describe("checkRateLimit", () => {
    it("should allow requests under the limit", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");

      const result = checkRateLimit("test-key-1", 5, 60000);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should decrement remaining count on each request", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      const key = "test-key-2";

      const result1 = checkRateLimit(key, 5, 60000);
      const result2 = checkRateLimit(key, 5, 60000);
      const result3 = checkRateLimit(key, 5, 60000);

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
      expect(result3.remaining).toBe(2);
    });

    it("should block requests when limit is exceeded", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      const key = "test-key-3";

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60000);
      }

      // 6th request should be blocked
      const result = checkRateLimit(key, 5, 60000);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      const key = "test-key-4";

      // Use a very short window
      const shortWindow = 50; // 50ms

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, shortWindow);
      }

      // Should be blocked
      expect(checkRateLimit(key, 5, shortWindow).success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be allowed again
      const result = checkRateLimit(key, 5, shortWindow);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should track different keys independently", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");

      // Exhaust limit for key1
      for (let i = 0; i < 5; i++) {
        checkRateLimit("key1", 5, 60000);
      }

      // key1 should be blocked
      expect(checkRateLimit("key1", 5, 60000).success).toBe(false);

      // key2 should still be allowed
      const result = checkRateLimit("key2", 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe("checkRateLimitAsync", () => {
    it("should work asynchronously", async () => {
      const { checkRateLimitAsync } = await import("@/lib/rate-limit");

      const result = await checkRateLimitAsync("async-test-1", 10, 60000);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should block when limit exceeded", async () => {
      const { checkRateLimitAsync } = await import("@/lib/rate-limit");
      const key = "async-test-2";

      // Exhaust limit
      for (let i = 0; i < 3; i++) {
        await checkRateLimitAsync(key, 3, 60000);
      }

      const result = await checkRateLimitAsync(key, 3, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("getClientIp", () => {
    beforeEach(() => {
      process.env.VERCEL = "1";
    });

    afterEach(() => {
      process.env.VERCEL = undefined;
    });

    it("should extract IP from X-Forwarded-For header", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("should extract IP from X-Real-IP header", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "172.16.0.1" },
      });

      expect(getClientIp(request)).toBe("172.16.0.1");
    });

    it("should prefer X-Forwarded-For over X-Real-IP", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "172.16.0.1",
        },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("should return fingerprint when no headers present", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = new Request("http://localhost");

      expect(getClientIp(request)).toContain("fingerprint:");
    });

    it("should trim whitespace from IP", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "  192.168.1.1  " },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });
  });

  describe("RATE_LIMITS configuration", () => {
    it("should have sensible defaults", async () => {
      const { RATE_LIMITS } = await import("@/lib/rate-limit");

      // Login should be strict
      expect(RATE_LIMITS.login.limit).toBe(5);
      expect(RATE_LIMITS.login.windowMs).toBe(60 * 1000);

      // API should be more lenient
      expect(RATE_LIMITS.api.limit).toBe(100);
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);

      // Upload should be limited
      expect(RATE_LIMITS.upload.limit).toBe(10);

      // Password reset should be very limited
      expect(RATE_LIMITS.passwordReset.limit).toBe(3);
      expect(RATE_LIMITS.passwordReset.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });
});
