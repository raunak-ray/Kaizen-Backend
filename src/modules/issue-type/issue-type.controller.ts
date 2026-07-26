import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { issueTypeService } from "./issue-type.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueTypeService.create(
    req.params.projectId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 201, "Type created successfully", result);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueTypeService.findById(
    req.params.projectId as string,
    req.params.typeId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Type retrieved successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueTypeService.findAll(req.params.projectId as string, req.user!.id);
  successResponse(res, 200, "Types retrieved successfully", result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueTypeService.update(
    req.params.projectId as string,
    req.params.typeId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Type updated successfully", result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueTypeService.archive(
    req.params.projectId as string,
    req.params.typeId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Type archived successfully", result);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueTypeService.restore(
    req.params.projectId as string,
    req.params.typeId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Type restored successfully", result);
});
