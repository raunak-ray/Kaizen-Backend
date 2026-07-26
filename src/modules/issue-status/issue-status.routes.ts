import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as issueStatusController from "./issue-status.controller";
import {
  createStatusSchema,
  projectIdSchema,
  statusIdSchema,
  updateStatusSchema,
} from "./issue-status.schema";
import "./issue-status.swagger";

const issueStatusRouter = Router({ mergeParams: true });

issueStatusRouter.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/statuses:
 *   post:
 *     summary: Create a status
 *     tags: [Issue Statuses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateIssueStatusRequest' }
 *     responses:
 *       201: { description: Status created successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project not found }
 *       409: { description: A status with this name already exists in the project }
 */
issueStatusRouter.post(
  "/",
  validate({ params: projectIdSchema, body: createStatusSchema }),
  issueStatusController.create,
);

/**
 * @openapi
 * /projects/{projectId}/statuses:
 *   get:
 *     summary: List project statuses
 *     tags: [Issue Statuses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Statuses retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project not found }
 */
issueStatusRouter.get("/", validate({ params: projectIdSchema }), issueStatusController.findAll);

/**
 * @openapi
 * /projects/{projectId}/statuses/{statusId}:
 *   get:
 *     summary: Get a status
 *     tags: [Issue Statuses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: statusId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Status retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or status not found }
 */
issueStatusRouter.get(
  "/:statusId",
  validate({ params: statusIdSchema }),
  issueStatusController.findById,
);

/**
 * @openapi
 * /projects/{projectId}/statuses/{statusId}:
 *   patch:
 *     summary: Update a status
 *     tags: [Issue Statuses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: statusId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateIssueStatusRequest' }
 *     responses:
 *       200: { description: Status updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or status not found }
 *       409: { description: A status with this name already exists in the project }
 */
issueStatusRouter.patch(
  "/:statusId",
  validate({ params: statusIdSchema, body: updateStatusSchema }),
  issueStatusController.update,
);

/**
 * @openapi
 * /projects/{projectId}/statuses/{statusId}/archive:
 *   patch:
 *     summary: Archive a status
 *     tags: [Issue Statuses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: statusId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Status archived successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or status not found }
 */
issueStatusRouter.patch(
  "/:statusId/archive",
  validate({ params: statusIdSchema }),
  issueStatusController.archive,
);

/**
 * @openapi
 * /projects/{projectId}/statuses/{statusId}/restore:
 *   patch:
 *     summary: Restore an archived status
 *     tags: [Issue Statuses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: statusId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Status restored successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or status not found }
 *       409: { description: Status is not archived }
 */
issueStatusRouter.patch(
  "/:statusId/restore",
  validate({ params: statusIdSchema }),
  issueStatusController.restore,
);

export default issueStatusRouter;
