import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as issueLabelController from "./issue-label.controller";
import {
  createLabelSchema,
  labelIdSchema,
  projectIdSchema,
  updateLabelSchema,
} from "./issue-label.schema";
import "./issue-label.swagger";

const issueLabelRouter = Router({ mergeParams: true });

issueLabelRouter.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/labels:
 *   post:
 *     summary: Create a label
 *     tags: [Issue Labels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateIssueLabelRequest' }
 *     responses:
 *       201: { description: Label created successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project not found }
 *       409: { description: A label with this name already exists in the project }
 */
issueLabelRouter.post(
  "/",
  validate({ params: projectIdSchema, body: createLabelSchema }),
  issueLabelController.create,
);

/**
 * @openapi
 * /projects/{projectId}/labels:
 *   get:
 *     summary: List project labels
 *     tags: [Issue Labels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Labels retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project not found }
 */
issueLabelRouter.get("/", validate({ params: projectIdSchema }), issueLabelController.findAll);

/**
 * @openapi
 * /projects/{projectId}/labels/{labelId}:
 *   get:
 *     summary: Get a label
 *     tags: [Issue Labels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: labelId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Label retrieved successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not a project member }
 *       404: { description: Project or label not found }
 */
issueLabelRouter.get(
  "/:labelId",
  validate({ params: labelIdSchema }),
  issueLabelController.findById,
);

/**
 * @openapi
 * /projects/{projectId}/labels/{labelId}:
 *   patch:
 *     summary: Update a label
 *     tags: [Issue Labels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: labelId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateIssueLabelRequest' }
 *     responses:
 *       200: { description: Label updated successfully }
 *       400: { description: Invalid request data }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or label not found }
 *       409: { description: A label with this name already exists in the project }
 */
issueLabelRouter.patch(
  "/:labelId",
  validate({ params: labelIdSchema, body: updateLabelSchema }),
  issueLabelController.update,
);

/**
 * @openapi
 * /projects/{projectId}/labels/{labelId}/archive:
 *   patch:
 *     summary: Archive a label
 *     tags: [Issue Labels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: labelId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Label archived successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or label not found }
 */
issueLabelRouter.patch(
  "/:labelId/archive",
  validate({ params: labelIdSchema }),
  issueLabelController.archive,
);

/**
 * @openapi
 * /projects/{projectId}/labels/{labelId}/restore:
 *   patch:
 *     summary: Restore an archived label
 *     tags: [Issue Labels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: labelId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Label restored successfully }
 *       401: { description: Authentication required }
 *       403: { description: Requesting user is not the project owner }
 *       404: { description: Project or label not found }
 *       409: { description: Label is not archived }
 */
issueLabelRouter.patch(
  "/:labelId/restore",
  validate({ params: labelIdSchema }),
  issueLabelController.restore,
);

export default issueLabelRouter;
