import type { Request, Response } from "express";
import { successResponse } from "@/lib/responses";
import { asyncHandler } from "@/utils/asyncHanlder";
import { projectMemberService } from "./project-member.service";

export const invite = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectMemberService.invite(
    req.params.projectId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 201, "Member invited successfully", result);
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectMemberService.findAll(req.params.projectId as string);
  successResponse(res, 200, "Project members retrieved successfully", result);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectMemberService.updateRole(
    req.params.projectId as string,
    req.params.memberId as string,
    req.body,
    req.user!.id,
  );
  successResponse(res, 200, "Member role updated successfully", result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await projectMemberService.remove(
    req.params.projectId as string,
    req.params.memberId as string,
    req.user!.id,
  );
  successResponse(res, 200, "Member removed successfully", null);
});
