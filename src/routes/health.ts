import { Router } from "express";
import { successResponse } from "../lib/responses/index.js";
import { formatUptime } from "../utils/uptime.js";
import { env } from "../../config/env.js";

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the current status, uptime, and timestamp of the server.
 *     responses:
 *       200:
 *         description: Server is healthy
 */
healthRouter.get(`/health`, (_req, res) => {
  res.status(200).json(
    successResponse({
      status: "ok",
      uptime: formatUptime(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
});
