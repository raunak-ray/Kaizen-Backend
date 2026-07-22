import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { authService } from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, { ip: req.ip });
  successResponse(res, 201, "User registered successfully", result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, { ip: req.ip });
  successResponse(res, 200, "Login successful", result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body, { ip: req.ip });
  successResponse(res, 200, "Token refreshed successfully", result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.id, { ip: req.ip });
  successResponse(res, 200, "Logged out successfully", null);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  successResponse(res, 200, "Current user retrieved successfully", user);
});
