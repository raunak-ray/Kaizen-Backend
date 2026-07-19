import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { closeDatabase, connectDatabase } from "../db/client.js";
import { createApp } from "./app.js";

async function startServer(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs available at http://localhost:${env.PORT}/api/docs`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down gracefully`);

    server.close((err) => {
      closeDatabase().catch((dbErr: unknown) => {
        logger.error({ err: dbErr }, "Error while closing database connection");
      });
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err: unknown) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
