import { defineConfig } from "vitest/config";

export default defineConfig({
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
