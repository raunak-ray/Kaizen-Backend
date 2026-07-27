import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { issueLabelService } from "./issue-label.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueLabelService.create(
    req.params.projectId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 201, "Label created successfully", result);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueLabelService.findById(
    req.params.projectId as string,
    req.params.labelId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Label retrieved successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueLabelService.findAll(req.params.projectId as string, req.user!.id);
  successResponse(res, 200, "Labels retrieved successfully", result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueLabelService.update(
    req.params.projectId as string,
    req.params.labelId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Label updated successfully", result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueLabelService.archive(
    req.params.projectId as string,
    req.params.labelId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Label archived successfully", result);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueLabelService.restore(
    req.params.projectId as string,
    req.params.labelId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Label restored successfully", result);
});
