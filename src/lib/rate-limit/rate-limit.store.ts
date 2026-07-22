import type { Store } from "express-rate-limit";

/**
 * Single point of control for the rate limiter storage backend. Returning
 * `undefined` makes express-rate-limit fall back to its in-memory
 * MemoryStore, which is correct for a single instance.
 *
 * When the app scales horizontally, replace the body of this function with
 * a `rate-limit-redis` RedisStore — every limiter is built through
 * createRateLimiter(), so no call sites need to change.
 *
 * Each limiter must get its own store instance (stores must not be shared
 * across limiters with different keys/limits), so this is a factory rather
 * than a singleton.
 */
export function createRateLimitStore(): Store | undefined {
  return undefined;
}
