import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as issueController from "./issue.controller";
import {
  assignIssueSchema,
  changePrioritySchema,
  changeStatusSchema,
  createIssueSchema,
  issueIdSchema,
  listIssuesSchema,
  projectIdSchema,
  updateIssueSchema,
} from "./issue.schema";
import "./issue.swagger";

const issueRouter = Router({ mergeParams: true });

issueRouter.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/issues:
 *   post:
 *     summary: Create an issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateIssueRequest' }
 *     responses:
 *       201: { description: Issue created successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or assignee not found }
 */
issueRouter.post(
  "/",
  validate({ params: projectIdSchema, body: createIssueSchema }),
  issueController.create,
);

/**
 * @openapi
 * /projects/{projectId}/issues:
 *   get:
 *     summary: List project issues
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [todo, in-progress, done] } }
 *       - { in: query, name: priority, schema: { type: string, enum: [low, medium, high] } }
 *       - { in: query, name: type, schema: { type: string, enum: [task, bug-fix] } }
 *       - { in: query, name: assigneeId, schema: { type: string, format: uuid } }
 *       - { in: query, name: archived, schema: { type: boolean } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Issues retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project not found }
 */
issueRouter.get(
  "/",
  validate({ params: projectIdSchema, query: listIssuesSchema }),
  issueController.findAll,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}:
 *   get:
 *     summary: Get an issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Issue retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 */
issueRouter.get("/:issueId", validate({ params: issueIdSchema }), issueController.findById);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}:
 *   patch:
 *     summary: Update an issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateIssueRequest' }
 *     responses:
 *       200: { description: Issue updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 *       409: { description: Archived issues cannot be modified }
 */
issueRouter.patch(
  "/:issueId",
  validate({ params: issueIdSchema, body: updateIssueSchema }),
  issueController.update,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}/assign:
 *   patch:
 *     summary: Assign or unassign an issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssignIssueRequest' }
 *     responses:
 *       200: { description: Issue assigned successfully }
 *       400: { description: Invalid request data, or assignee is not a project member }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project, issue, or assignee not found }
 *       409: { description: Archived issues cannot be modified }
 */
issueRouter.patch(
  "/:issueId/assign",
  validate({ params: issueIdSchema, body: assignIssueSchema }),
  issueController.assign,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}/status:
 *   patch:
 *     summary: Change an issue's status
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangeIssueStatusRequest' }
 *     responses:
 *       200: { description: Issue status updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 *       409: { description: Archived issues cannot be modified }
 */
issueRouter.patch(
  "/:issueId/status",
  validate({ params: issueIdSchema, body: changeStatusSchema }),
  issueController.changeStatus,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}/priority:
 *   patch:
 *     summary: Change an issue's priority
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangeIssuePriorityRequest' }
 *     responses:
 *       200: { description: Issue priority updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 *       409: { description: Archived issues cannot be modified }
 */
issueRouter.patch(
  "/:issueId/priority",
  validate({ params: issueIdSchema, body: changePrioritySchema }),
  issueController.changePriority,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}/archive:
 *   patch:
 *     summary: Archive an issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Issue archived successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 */
issueRouter.patch(
  "/:issueId/archive",
  validate({ params: issueIdSchema }),
  issueController.archive,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}/restore:
 *   patch:
 *     summary: Restore an archived issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Issue restored successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 *       409: { description: Issue is not archived }
 */
issueRouter.patch(
  "/:issueId/restore",
  validate({ params: issueIdSchema }),
  issueController.restore,
);

/**
 * @openapi
 * /projects/{projectId}/issues/{issueId}:
 *   delete:
 *     summary: Delete an issue
 *     tags: [Issues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: issueId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Issue deleted successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or issue not found }
 */
issueRouter.delete("/:issueId", validate({ params: issueIdSchema }), issueController.remove);

export default issueRouter;
