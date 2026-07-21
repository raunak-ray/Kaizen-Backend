import type { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import { isTest } from "@config/env";
import { logger } from "@config/logger";
import { createRateLimitStore } from "./rate-limit.store";
import type { RateLimitRule } from "./rate-limit.types";

const DEFAULT_MESSAGE = "Too many requests, please try again later";

interface CreateRateLimiterOptions extends RateLimitRule {
  /** Identifies this limiter in logs, e.g. "auth.login". */
  name: string;
  keyGenerator?: Options["keyGenerator"];
}

function passthrough(_req: Request, _res: Response, next: NextFunction): void {
  next();
}

/**
 * Builds an IP-keyed rate limiter. Disabled (passthrough) under NODE_ENV=test
 * so integration tests aren't throttled by shared windows.
 */
export function createRateLimiter({
  name,
  windowMs,
  max,
  message,
  keyGenerator,
}: CreateRateLimiterOptions): RequestHandler {
  if (isTest) {
    return passthrough;
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRateLimitStore(),
    keyGenerator,
    handler(req, res, _next, options) {
      logger.warn(
        { rateLimiter: name, ip: req.ip, path: req.originalUrl, method: req.method },
        "Rate limit exceeded",
      );
      res.status(options.statusCode).json(options.message);
    },
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: message ?? DEFAULT_MESSAGE,
      },
    },
  });
}

function userKeyGenerator(req: Request): string {
  return req.user?.id ?? ipKeyGenerator(req.ip!);
}

/**
 * Builds a per-user rate limiter, falling back to IP when unauthenticated.
 * Reusable across any module (Projects, Issues, Comments, ...) that needs
 * per-user throttling on authenticated routes.
 *
 * Must be mounted AFTER the route's `authenticate` middleware, otherwise
 * `req.user` is not yet populated and every request falls back to the IP key.
 */
export function createUserRateLimiter(options: RateLimitRule & { name: string }): RequestHandler {
  return createRateLimiter({ ...options, keyGenerator: userKeyGenerator });
}
