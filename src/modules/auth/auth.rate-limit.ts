import { rateLimitConfig } from "@config/rate-limit.config";
import { createRateLimiter, createUserRateLimiter } from "@/lib/rate-limit";

export const authRateLimiters = {
  register: createRateLimiter({
    name: "auth.register",
    ...rateLimitConfig.auth.register,
    message: "Too many registration attempts, please try again later",
  }),

  login: createRateLimiter({
    name: "auth.login",
    ...rateLimitConfig.auth.login,
    message: "Too many login attempts, please try again later",
  }),

  refresh: createRateLimiter({
    name: "auth.refresh",
    ...rateLimitConfig.auth.refresh,
    message: "Too many token refresh attempts, please try again later",
  }),

  // Mounted after `authenticate`, so this keys per-user rather than per-IP.
  me: createUserRateLimiter({
    name: "auth.me",
    ...rateLimitConfig.auth.me,
  }),
};
