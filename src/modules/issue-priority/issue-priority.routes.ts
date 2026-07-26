import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as issuePriorityController from "./issue-priority.controller";
import {
  createPrioritySchema,
  priorityIdSchema,
  projectIdSchema,
  updatePrioritySchema,
} from "./issue-priority.schema";
import "./issue-priority.swagger";

const issuePriorityRouter = Router({ mergeParams: true });

issuePriorityRouter.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/priorities:
 *   post:
 *     summary: Create a priority
 *     tags: [Issue Priorities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateIssuePriorityRequest' }
 *     responses:
 *       201: { description: Priority created successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project not found }
 *       409: { description: A priority with this name already exists in the project }
 */
issuePriorityRouter.post(
  "/",
  validate({ params: projectIdSchema, body: createPrioritySchema }),
  issuePriorityController.create,
);

/**
 * @openapi
 * /projects/{projectId}/priorities:
 *   get:
 *     summary: List project priorities
 *     tags: [Issue Priorities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Priorities retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project not found }
 */
issuePriorityRouter.get(
  "/",
  validate({ params: projectIdSchema }),
  issuePriorityController.findAll,
);

/**
 * @openapi
 * /projects/{projectId}/priorities/{priorityId}:
 *   get:
 *     summary: Get a priority
 *     tags: [Issue Priorities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: priorityId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Priority retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or priority not found }
 */
issuePriorityRouter.get(
  "/:priorityId",
  validate({ params: priorityIdSchema }),
  issuePriorityController.findById,
);

/**
 * @openapi
 * /projects/{projectId}/priorities/{priorityId}:
 *   patch:
 *     summary: Update a priority
 *     tags: [Issue Priorities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: priorityId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateIssuePriorityRequest' }
 *     responses:
 *       200: { description: Priority updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or priority not found }
 *       409: { description: A priority with this name already exists in the project }
 */
issuePriorityRouter.patch(
  "/:priorityId",
  validate({ params: priorityIdSchema, body: updatePrioritySchema }),
  issuePriorityController.update,
);

/**
 * @openapi
 * /projects/{projectId}/priorities/{priorityId}/archive:
 *   patch:
 *     summary: Archive a priority
 *     tags: [Issue Priorities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: priorityId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Priority archived successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or priority not found }
 */
issuePriorityRouter.patch(
  "/:priorityId/archive",
  validate({ params: priorityIdSchema }),
  issuePriorityController.archive,
);

/**
 * @openapi
 * /projects/{projectId}/priorities/{priorityId}/restore:
 *   patch:
 *     summary: Restore an archived priority
 *     tags: [Issue Priorities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: priorityId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Priority restored successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or priority not found }
 *       409: { description: Priority is not archived }
 */
issuePriorityRouter.patch(
  "/:priorityId/restore",
  validate({ params: priorityIdSchema }),
  issuePriorityController.restore,
);

export default issuePriorityRouter;
