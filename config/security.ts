import type { CorsOptions } from "cors";
import type { HelmetOptions } from "helmet";
import { env } from "./env.js";

export const corsOptions: CorsOptions = {
  origin:
    env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  credentials: true,
};

export const helmetOptions: HelmetOptions = {
  crossOriginResourcePolicy: { policy: "cross-origin" },
};

export const cookieOptions = {
  domain: env.COOKIE_DOMAIN,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  httpOnly: true,
} as const;
