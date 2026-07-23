import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as projectMemberController from "./project-member.controller";
import {
  inviteMemberSchema,
  memberIdSchema,
  projectIdSchema,
  updateMemberRoleSchema,
} from "./project-member.schema";
import "./project-member.swagger";

const projectMemberRouter = Router({ mergeParams: true });

projectMemberRouter.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/members:
 *   post:
 *     summary: Invite a project member
 *     tags: [Project Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InviteProjectMemberRequest' }
 *     responses:
 *       201: { description: Member invited successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Only the project owner may invite members }
 *       404: { description: Project or user not found }
 *       409: { description: User is already a member }
 */
projectMemberRouter.post(
  "/",
  validate({ params: projectIdSchema, body: inviteMemberSchema }),
  projectMemberController.invite,
);

/**
 * @openapi
 * /projects/{projectId}/members:
 *   get:
 *     summary: List project members
 *     tags: [Project Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Project members retrieved successfully }
 *       401: { description: Authentication required }
 *       404: { description: Project not found }
 */
projectMemberRouter.get(
  "/",
  validate({ params: projectIdSchema }),
  projectMemberController.findAll,
);

/**
 * @openapi
 * /projects/{projectId}/members/{memberId}:
 *   patch:
 *     summary: Update a project member role
 *     tags: [Project Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: memberId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProjectMemberRoleRequest' }
 *     responses:
 *       200: { description: Member role updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Only the project owner may update roles }
 *       404: { description: Project or member not found }
 *       409: { description: Owner role cannot be changed }
 */
projectMemberRouter.patch(
  "/:memberId",
  validate({ params: memberIdSchema, body: updateMemberRoleSchema }),
  projectMemberController.updateRole,
);

/**
 * @openapi
 * /projects/{projectId}/members/{memberId}:
 *   delete:
 *     summary: Remove a project member
 *     tags: [Project Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: memberId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Member removed successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Only the project owner may remove members }
 *       404: { description: Project or member not found }
 *       409: { description: Owner cannot be removed }
 */
projectMemberRouter.delete(
  "/:memberId",
  validate({ params: memberIdSchema }),
  projectMemberController.remove,
);

export default projectMemberRouter;
