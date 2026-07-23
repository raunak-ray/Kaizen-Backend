import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "../config/logger";
import { corsOptions, helmetOptions } from "../config/security";
import { swaggerSpec } from "../config/swagger";
import { globalErrorHandler, notFoundHandler } from "./lib/errors/index";
import { requestId } from "./lib/middleware/index";
import { healthRouter } from "./routes/health";
import authRouter from "@/modules/auth/auth.routes";
import projectRouter from "@/modules/projects/project.routes";
import projectMemberRouter from "@/modules/project-members/project-member.routes";
import { env } from "../config/env";

export function createApp(): Application {
  const app = express();

  app.disable("x-powered-by");
  // Number of reverse-proxy hops to trust for X-Forwarded-For; required for
  // req.ip (and therefore IP-based rate limiting) to reflect the real client
  // rather than the proxy when deployed behind a load balancer.
  app.set("trust proxy", env.TRUST_PROXY);

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
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/projects`, projectRouter);
  app.use(`${env.API_PREFIX}/projects/:projectId/members`, projectMemberRouter);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
