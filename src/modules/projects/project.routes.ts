import { Router } from "express";
import { validate } from "@/lib/validators";
import { authenticate } from "@/modules/auth/auth.middleware";
import * as projectController from "./project.controller";
import { createProjectSchema, projectIdSchema, updateProjectSchema } from "./project.schema";
import "./project.swagger";

const projectRouter = Router();

projectRouter.use(authenticate);

/**
 * @openapi
 * /projects:
 *   post:
 *     summary: Create a project
 *     description: Creates a new project owned by the authenticated user. The project key is generated automatically and cannot be changed.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean, example: true }
 *                     statusCode: { type: integer, example: 201 }
 *                     message: { type: string, example: Project created successfully }
 *                     data:
 *                       $ref: '#/components/schemas/ProjectResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
projectRouter.post("/", validate({ body: createProjectSchema }), projectController.create);

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List projects
 *     description: Returns every public project plus the projects owned by the authenticated user.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean, example: true }
 *                     statusCode: { type: integer, example: 200 }
 *                     message: { type: string, example: Projects retrieved successfully }
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProjectResponse'
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
projectRouter.get("/", projectController.findAll);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     summary: Get a project
 *     description: Returns a single project by id. Private projects are only visible to their owner.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean, example: true }
 *                     statusCode: { type: integer, example: 200 }
 *                     message: { type: string, example: Project retrieved successfully }
 *                     data:
 *                       $ref: '#/components/schemas/ProjectResponse'
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found, or not visible to the current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
projectRouter.get("/:id", validate({ params: projectIdSchema }), projectController.findById);

/**
 * @openapi
 * /projects/{id}:
 *   patch:
 *     summary: Update a project
 *     description: Updates a project's name, description, and/or visibility. Only the owner may update; archived projects cannot be updated.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean, example: true }
 *                     statusCode: { type: integer, example: 200 }
 *                     message: { type: string, example: Project updated successfully }
 *                     data:
 *                       $ref: '#/components/schemas/ProjectResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: The authenticated user is not the project owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: The project is archived and cannot be updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
projectRouter.patch(
  "/:id",
  validate({ params: projectIdSchema, body: updateProjectSchema }),
  projectController.update,
);

/**
 * @openapi
 * /projects/{id}/archive:
 *   patch:
 *     summary: Archive a project
 *     description: Marks a project as archived. Only the owner may archive a project.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean, example: true }
 *                     statusCode: { type: integer, example: 200 }
 *                     message: { type: string, example: Project archived successfully }
 *                     data:
 *                       $ref: '#/components/schemas/ProjectResponse'
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: The authenticated user is not the project owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
projectRouter.patch(
  "/:id/archive",
  validate({ params: projectIdSchema }),
  projectController.archive,
);

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Permanently deletes a project. Only the owner may delete a project.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Project deleted successfully }
 *                 data: { type: object, nullable: true, example: null }
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: The authenticated user is not the project owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
projectRouter.delete("/:id", validate({ params: projectIdSchema }), projectController.remove);

export default projectRouter;
