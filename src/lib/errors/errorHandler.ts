import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../../../config/logger.js";
import { errorResponse } from "../responses/index.js";
import { AppError } from "./AppError.js";

export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(errorResponse("NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, "Unexpected application error");
    }
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", "Invalid request data", err.flatten()));
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong"));
}
