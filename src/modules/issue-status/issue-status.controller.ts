import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { issueStatusService } from "./issue-status.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueStatusService.create(
    req.params.projectId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 201, "Status created successfully", result);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueStatusService.findById(
    req.params.projectId as string,
    req.params.statusId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Status retrieved successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueStatusService.findAll(req.params.projectId as string, req.user!.id);
  successResponse(res, 200, "Statuses retrieved successfully", result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueStatusService.update(
    req.params.projectId as string,
    req.params.statusId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Status updated successfully", result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueStatusService.archive(
    req.params.projectId as string,
    req.params.statusId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Status archived successfully", result);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueStatusService.restore(
    req.params.projectId as string,
    req.params.statusId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Status restored successfully", result);
});
