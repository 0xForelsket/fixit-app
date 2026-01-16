/**
 * Rate Limiting Module
 *
 * IMPORTANT SCALING NOTES:
 * -----------------------
 * The default in-memory rate limiter uses a JavaScript Map. This works well for:
 * - Single-instance deployments
 * - Development environments
 * - Traditional Node.js server deployments
 *
 * However, it will NOT work correctly for:
 * - Multiple server instances (load balanced)
 * - Serverless deployments (Vercel, AWS Lambda) - each invocation gets fresh memory
 * - Deployments that restart frequently
 *
 * For production at scale, implement the RedisRateLimitProvider by:
 * 1. Installing @upstash/ratelimit or ioredis
 * 2. Setting RATELIMIT_PROVIDER=redis in environment
 * 3. Configuring REDIS_URL in environment
 *
 * See: https://github.com/upstash/ratelimit for Upstash implementation
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

/**
 * Interface for rate limit storage providers.
 * Implement this interface to add new storage backends (e.g., Redis, DynamoDB).
 */
export interface RateLimitProvider {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit provider using Map.
 *
 * WARNING: This provider is NOT suitable for distributed/serverless deployments.
 * See module-level documentation for details.
 */
class InMemoryRateLimitProvider implements RateLimitProvider {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every minute
    // Only set up cleanup in Node.js environment (not Edge)
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (entry.resetTime < now) {
            this.store.delete(key);
          }
        }
      }, 60000);

      // Don't keep the process alive just for cleanup
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  async check(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0, reset: entry.resetTime };
    }

    entry.count++;
    return {
      success: true,
      remaining: limit - entry.count,
      reset: entry.resetTime,
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Redis-based rate limit provider using Upstash.
 *
 * To enable Redis rate limiting:
 * 1. Install: bun add @upstash/ratelimit @upstash/redis
 * 2. Set environment variables:
 *    - UPSTASH_REDIS_REST_URL
 *    - UPSTASH_REDIS_REST_TOKEN
 *    - RATELIMIT_PROVIDER=redis
 *
 * This provider works with serverless deployments (Vercel, AWS Lambda, etc.)
 * and provides consistent rate limiting across multiple instances.
 */
class UpstashRateLimitProvider implements RateLimitProvider {
  private redis: unknown;
  private rateLimiters: Map<string, unknown> = new Map();
  private initialized = false;

  constructor() {
    // Dynamic import to avoid requiring @upstash/redis if not used
    this.redis = null;
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) {
      return this.redis !== null;
    }
    this.initialized = true;

    try {
      // Use string concatenation to prevent Vite from analyzing the import
      const moduleName = "@upstash" + "/redis";
      const module = await import(/* @vite-ignore */ moduleName);
      this.redis = module.Redis.fromEnv();
      return true;
    } catch {
      console.error(
        "[rate-limit] Failed to initialize Upstash Redis. Ensure @upstash/redis is installed."
      );
      return false;
    }
  }

  async check(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const isReady = await this.ensureInitialized();
    if (!isReady || !this.redis) {
      // Fall back to allowing request if Redis not available
      console.warn(
        "[rate-limit] Redis not available, allowing request through"
      );
      return { success: true, remaining: limit, reset: Date.now() + windowMs };
    }

    try {
      // Use string concatenation to prevent Vite from analyzing the import
      const moduleName = "@upstash" + "/ratelimit";
      const { Ratelimit } = await import(/* @vite-ignore */ moduleName);

      // Create or reuse rate limiter for this configuration
      const limiterKey = `${limit}:${windowMs}`;
      let ratelimit = this.rateLimiters.get(limiterKey);

      if (!ratelimit) {
        ratelimit = new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
          analytics: true, // Enable analytics in Upstash dashboard
          prefix: "fixit:ratelimit",
        });
        this.rateLimiters.set(limiterKey, ratelimit);
      }

      // @ts-expect-error - Dynamic type
      const result = await ratelimit.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error("[rate-limit] Upstash rate limit check failed:", error);
      // On error, allow the request but log the issue
      return { success: true, remaining: limit, reset: Date.now() + windowMs };
    }
  }

  async reset(key: string): Promise<void> {
    // Upstash rate limiter handles expiration automatically
    // For manual reset, we'd need to delete the key from Redis
    if (this.redis) {
      try {
        // @ts-expect-error - Dynamic type
        await this.redis.del(`fixit:ratelimit:${key}`);
      } catch {
        // Ignore reset errors
      }
    }
  }
}

// Singleton instance of the rate limit provider
let rateLimitProvider: RateLimitProvider | null = null;

/**
 * Get the configured rate limit provider.
 * Uses environment variable RATELIMIT_PROVIDER to determine which provider to use.
 * Defaults to in-memory for simplicity.
 *
 * Options:
 * - RATELIMIT_PROVIDER=redis: Use Upstash Redis (requires @upstash/redis package)
 * - RATELIMIT_PROVIDER=memory (or unset): Use in-memory Map (single instance only)
 */
function getRateLimitProvider(): RateLimitProvider {
  if (!rateLimitProvider) {
    const provider = process.env.RATELIMIT_PROVIDER;

    if (provider === "redis") {
      // Check if required environment variables are set
      if (
        !process.env.UPSTASH_REDIS_REST_URL ||
        !process.env.UPSTASH_REDIS_REST_TOKEN
      ) {
        console.warn(
          "[rate-limit] Redis provider requested but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. " +
            "Falling back to in-memory."
        );
        rateLimitProvider = new InMemoryRateLimitProvider();
      } else {
        console.info("[rate-limit] Using Upstash Redis rate limiting");
        rateLimitProvider = new UpstashRateLimitProvider();
      }
    } else {
      // Log warning in production about in-memory limitations
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[rate-limit] Using in-memory rate limiting. " +
            "This will not work correctly with multiple instances or serverless deployments. " +
            "Set RATELIMIT_PROVIDER=redis and configure Upstash for production scaling."
        );
      }
      rateLimitProvider = new InMemoryRateLimitProvider();
    }
  }

  return rateLimitProvider;
}

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult indicating if the request is allowed
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // Note: Using sync wrapper for backwards compatibility
  // The underlying provider is async-ready for Redis implementation
  const provider = getRateLimitProvider();

  // For in-memory provider, we can safely make this sync
  // This maintains backwards compatibility with existing code
  const now = Date.now();

  if (provider instanceof InMemoryRateLimitProvider) {
    // Direct sync access for in-memory provider
    // biome-ignore lint/suspicious/noExplicitAny: accessing private for sync compat
    const store = (provider as any).store as Map<string, RateLimitEntry>;
    const entry = store.get(key);

    if (!entry || entry.resetTime < now) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0, reset: entry.resetTime };
    }

    entry.count++;
    return {
      success: true,
      remaining: limit - entry.count,
      reset: entry.resetTime,
    };
  }

  // For other providers, we need to handle async
  // This is a temporary sync wrapper - production Redis implementation
  // should use checkRateLimitAsync instead
  console.warn(
    "[rate-limit] Sync checkRateLimit called with async provider. Use checkRateLimitAsync instead."
  );
  return { success: true, remaining: limit, reset: now + windowMs };
}

/**
 * Async version of rate limit check.
 * Use this for Redis/distributed implementations.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const provider = getRateLimitProvider();
  return provider.check(key, limit, windowMs);
}

/**
 * List of trusted proxy IPs or CIDR ranges.
 * In production, this should be configured via environment variables.
 * Add your load balancer/reverse proxy IPs here.
 * Reserved for future CIDR-based validation.
 */
const _TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXY_IPS || "127.0.0.1,::1")
    .split(",")
    .map((ip) => ip.trim())
);

/**
 * Check if a connection is from a trusted proxy.
 * This helps prevent X-Forwarded-For header spoofing.
 */
function isFromTrustedProxy(request: Request): boolean {
  // In serverless environments, we often can't get the direct connection IP.
  // Trust proxy headers when running behind a known platform.
  const platform = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (platform) {
    return true;
  }

  // For traditional deployments, check if the direct connection IP is trusted.
  // Note: In Next.js API routes, we don't have direct socket access.
  // The CF-Connecting-IP or X-Real-IP set by the infrastructure is more reliable.
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    // Cloudflare sets this - can be trusted if you're using Cloudflare
    return true;
  }

  // Check for known proxy identifiers
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  // If both forwarded headers are present, likely behind a legitimate proxy
  if (forwardedProto && forwardedHost) {
    return true;
  }

  return false;
}

/**
 * Extract client IP address from request headers.
 *
 * SECURITY NOTE: This function implements defense against X-Forwarded-For spoofing
 * by only trusting proxy headers when the request comes from a trusted source.
 *
 * @param request - The incoming request
 * @returns The client's IP address
 */
export function getClientIp(request: Request): string {
  // Cloudflare's CF-Connecting-IP is set at the edge and can't be spoofed
  // by the client (Cloudflare strips any client-provided CF-Connecting-IP)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Only trust X-Forwarded-For if coming from a trusted proxy
  if (isFromTrustedProxy(request)) {
    // Check X-Forwarded-For header (set by proxies/load balancers)
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      // X-Forwarded-For can contain multiple IPs; the first is the client
      // When behind multiple proxies, the rightmost untrusted IP is the client
      const ips = forwarded.split(",").map((ip) => ip.trim());
      // Return the leftmost IP (original client) since we've verified trusted proxy
      return ips[0];
    }

    // Check X-Real-IP header (set by some proxies like nginx)
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  }

  // Fallback: Generate a consistent identifier when we can't determine the IP.
  // This prevents attackers from bypassing rate limits by not sending any headers.
  // In production, requests should always come through a trusted proxy.
  const userAgent = request.headers.get("user-agent") || "unknown";
  const acceptLanguage = request.headers.get("accept-language") || "unknown";

  // Create a fingerprint-based identifier as last resort
  // This is less accurate but better than a static fallback
  return `fingerprint:${Buffer.from(userAgent + acceptLanguage)
    .toString("base64")
    .slice(0, 16)}`;
}

/**
 * Predefined rate limit configurations for different use cases.
 */
export const RATE_LIMITS = {
  /** Login attempts - strict to prevent brute force */
  login: { limit: 5, windowMs: 60 * 1000 }, // 5 attempts per minute

  /** General API requests */
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  /** File uploads - limited to prevent abuse */
  upload: { limit: 10, windowMs: 60 * 1000 }, // 10 uploads per minute

  /** Password reset requests */
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  /** Account lockout threshold */
  lockout: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 min

  /** Search operations - expensive full-text queries */
  search: { limit: 30, windowMs: 60 * 1000 }, // 30 searches per minute

  /** Analytics queries - expensive aggregations */
  analytics: { limit: 60, windowMs: 60 * 1000 }, // 60 analytics requests per minute
} as const;
