import { env } from "./env.js";

export const rateLimitConfig = {
  auth: {
    register: {
      windowMs: env.RATE_LIMIT_AUTH_REGISTER_WINDOW_MS,
      max: env.RATE_LIMIT_AUTH_REGISTER_MAX,
    },
    login: {
      windowMs: env.RATE_LIMIT_AUTH_LOGIN_WINDOW_MS,
      max: env.RATE_LIMIT_AUTH_LOGIN_MAX,
    },
    refresh: {
      windowMs: env.RATE_LIMIT_AUTH_REFRESH_WINDOW_MS,
      max: env.RATE_LIMIT_AUTH_REFRESH_MAX,
    },
    me: {
      windowMs: env.RATE_LIMIT_AUTH_ME_WINDOW_MS,
      max: env.RATE_LIMIT_AUTH_ME_MAX,
    },
  },
} as const;
