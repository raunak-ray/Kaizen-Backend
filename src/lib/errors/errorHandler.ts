import type { NextFunction, Request, Response } from "express";
import z, { ZodError } from "zod";
import { logger } from "../../../config/logger.js";
import { errorResponse } from "../responses/index.js";
import { AppError } from "./AppError.js";

export function notFoundHandler(req: Request, res: Response) {
  return errorResponse(res, 404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
}

export function globalErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, "Unexpected application error");
    }
    return errorResponse(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid request data", z.treeifyError(err));
  }

  logger.error({ err }, "Unhandled error");
  return errorResponse(res, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
}
