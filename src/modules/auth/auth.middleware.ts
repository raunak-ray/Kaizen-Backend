import type { NextFunction, Request, Response } from "express";
import { AppError } from "@/lib/errors";
import { AUTH_ERRORS } from "./auth.constants";
import { authService } from "./auth.service";

const BEARER_PREFIX = "Bearer ";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    next(new AppError(AUTH_ERRORS.UNAUTHORIZED.message, 401, AUTH_ERRORS.UNAUTHORIZED.code));
    return;
  }

  const token = authHeader.slice(BEARER_PREFIX.length);

  req.user = await authService.validateAccessToken(token);
  next();
}
