import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { issueService } from "./issue.service";
import type { ListIssuesQuery } from "./issue.types";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.create(req.params.projectId as string, req.body, req.user!.id);
  successResponse(res, 201, "Issue created successfully", result);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.findById(
    req.params.projectId as string,
    req.params.issueId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Issue retrieved successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListIssuesQuery;
  const result = await issueService.findAll(req.params.projectId as string, query, req.user!.id);
  successResponse(res, 200, "Issues retrieved successfully", result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.update(
    req.params.projectId as string,
    req.params.issueId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Issue updated successfully", result);
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.assign(
    req.params.projectId as string,
    req.params.issueId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Issue assigned successfully", result);
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.changeStatus(
    req.params.projectId as string,
    req.params.issueId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Issue status updated successfully", result);
});

export const changePriority = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.changePriority(
    req.params.projectId as string,
    req.params.issueId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Issue priority updated successfully", result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.archive(
    req.params.projectId as string,
    req.params.issueId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Issue archived successfully", result);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await issueService.restore(
    req.params.projectId as string,
    req.params.issueId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Issue restored successfully", result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await issueService.remove(
    req.params.projectId as string,
    req.params.issueId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Issue deleted successfully", null);
});
