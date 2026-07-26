import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as issueTypeController from "./issue-type.controller";
import {
  createTypeSchema,
  projectIdSchema,
  typeIdSchema,
  updateTypeSchema,
} from "./issue-type.schema";
import "./issue-type.swagger";

const issueTypeRouter = Router({ mergeParams: true });

issueTypeRouter.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/types:
 *   post:
 *     summary: Create a type
 *     tags: [Issue Types]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateIssueTypeRequest' }
 *     responses:
 *       201: { description: Type created successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project not found }
 *       409: { description: A type with this name already exists in the project }
 */
issueTypeRouter.post(
  "/",
  validate({ params: projectIdSchema, body: createTypeSchema }),
  issueTypeController.create,
);

/**
 * @openapi
 * /projects/{projectId}/types:
 *   get:
 *     summary: List project types
 *     tags: [Issue Types]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Types retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project not found }
 */
issueTypeRouter.get("/", validate({ params: projectIdSchema }), issueTypeController.findAll);

/**
 * @openapi
 * /projects/{projectId}/types/{typeId}:
 *   get:
 *     summary: Get a type
 *     tags: [Issue Types]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: typeId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Type retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or type not found }
 */
issueTypeRouter.get("/:typeId", validate({ params: typeIdSchema }), issueTypeController.findById);

/**
 * @openapi
 * /projects/{projectId}/types/{typeId}:
 *   patch:
 *     summary: Update a type
 *     tags: [Issue Types]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: typeId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateIssueTypeRequest' }
 *     responses:
 *       200: { description: Type updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or type not found }
 *       409: { description: A type with this name already exists in the project }
 */
issueTypeRouter.patch(
  "/:typeId",
  validate({ params: typeIdSchema, body: updateTypeSchema }),
  issueTypeController.update,
);

/**
 * @openapi
 * /projects/{projectId}/types/{typeId}/archive:
 *   patch:
 *     summary: Archive a type
 *     tags: [Issue Types]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: typeId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Type archived successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or type not found }
 */
issueTypeRouter.patch(
  "/:typeId/archive",
  validate({ params: typeIdSchema }),
  issueTypeController.archive,
);

/**
 * @openapi
 * /projects/{projectId}/types/{typeId}/restore:
 *   patch:
 *     summary: Restore an archived type
 *     tags: [Issue Types]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: typeId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Type restored successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or type not found }
 *       409: { description: Type is not archived }
 */
issueTypeRouter.patch(
  "/:typeId/restore",
  validate({ params: typeIdSchema }),
  issueTypeController.restore,
);

export default issueTypeRouter;
