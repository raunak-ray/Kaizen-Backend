import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { issuePriorityService } from "./issue-priority.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await issuePriorityService.create(
    req.params.projectId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 201, "Priority created successfully", result);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const result = await issuePriorityService.findById(
    req.params.projectId as string,
    req.params.priorityId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Priority retrieved successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await issuePriorityService.findAll(req.params.projectId as string, req.user!.id);
  successResponse(res, 200, "Priorities retrieved successfully", result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await issuePriorityService.update(
    req.params.projectId as string,
    req.params.priorityId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Priority updated successfully", result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await issuePriorityService.archive(
    req.params.projectId as string,
    req.params.priorityId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Priority archived successfully", result);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await issuePriorityService.restore(
    req.params.projectId as string,
    req.params.priorityId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Priority restored successfully", result);
});
