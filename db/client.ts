import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const queryClient = postgres(env.DATABASE_URL, {
  onnotice: () => {},
});

export const db = drizzle(queryClient);

export async function connectDatabase(): Promise<void> {
  await queryClient`select 1`;
  logger.info("Database connection established");
}

export async function closeDatabase(): Promise<void> {
  await queryClient.end();
  logger.info("Database connection closed");
}
