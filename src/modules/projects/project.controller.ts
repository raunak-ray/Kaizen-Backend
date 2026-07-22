import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { projectService } from "./project.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.create(req.body, req.user!.id);
  successResponse(res, 201, "Project created successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.findAll(req.user!.id);
  successResponse(res, 200, "Projects retrieved successfully", result);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.findById(req.params.id as string, req.user!.id);
  successResponse(res, 200, "Project retrieved successfully", result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.update(req.params.id as string, req.body, req.user!.id);
  successResponse(res, 200, "Project updated successfully", result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.archive(req.params.id as string, req.user!.id);
  successResponse(res, 200, "Project archived successfully", result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await projectService.remove(req.params.id as string, req.user!.id);
  successResponse(res, 200, "Project deleted successfully", null);
});
