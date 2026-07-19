import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "../config/logger.js";
import { corsOptions, helmetOptions } from "../config/security.js";
import { swaggerSpec } from "../config/swagger.js";
import { globalErrorHandler, notFoundHandler } from "./lib/errors/index.js";
import { requestId } from "./lib/middleware/index.js";
import { healthRouter } from "./routes/health.js";
import { env } from "../config/env.js";

export function createApp(): Application {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      autoLogging: false,
    }),
  );

  app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;

      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

      if (res.statusCode >= 500) {
        logger.error(message);
      } else if (res.statusCode >= 400) {
        logger.warn(message);
      } else {
        logger.info(message);
      }
    });

    next();
  });

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(env.API_PREFIX, healthRouter);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
