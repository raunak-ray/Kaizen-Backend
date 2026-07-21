import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.resolve(rootDir, "src")}/`,
      "@config/": `${path.resolve(rootDir, "config")}/`,
      "@db/": `${path.resolve(rootDir, "db")}/`,
      "@tests/": `${path.resolve(rootDir, "tests")}/`,
    },
  },
  test: {
    environment: "node",
    globals: true,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/kaizen_test",
      LOG_LEVEL: "silent",
    },
  },
});
