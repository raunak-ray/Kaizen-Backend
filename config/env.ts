import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default("/api"),

  DATABASE_URL: z.string().url(),

  CORS_ORIGIN: z.string().default("*"),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

  // Number of hops (reverse proxies/load balancers) to trust when reading
  // the client IP from X-Forwarded-For. Required for correct per-IP rate
  // limiting in production; 0 means "trust no proxy, use the socket IP".
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(0),

  // JWT Config
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
  JWT_ISSUER: z.string().default("kaizen-backend"),
  JWT_AUDIENCE: z.string().default("kaizen-app"),

  // Rate limiting
  RATE_LIMIT_AUTH_REGISTER_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_AUTH_REGISTER_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_AUTH_LOGIN_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 1000),
  RATE_LIMIT_AUTH_LOGIN_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AUTH_REFRESH_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 1000),
  RATE_LIMIT_AUTH_REFRESH_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_AUTH_ME_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 1000),
  RATE_LIMIT_AUTH_ME_MAX: z.coerce.number().int().positive().default(100),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export type Env = typeof env;
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
