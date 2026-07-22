/**
 * @openapi
 * components:
 *   schemas:
 *     CreateProjectRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Project Phoenix
 *         description:
 *           type: string
 *           maxLength: 2000
 *           example: Rebuilding the checkout flow.
 *         visibility:
 *           type: string
 *           enum: [private, public]
 *           example: private
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Project Phoenix
 *         description:
 *           type: string
 *           maxLength: 2000
 *           example: Rebuilding the checkout flow.
 *         visibility:
 *           type: string
 *           enum: [private, public]
 *           example: public
 *     ProjectResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         key:
 *           type: string
 *           example: PROJ
 *         name:
 *           type: string
 *           example: Project Phoenix
 *         description:
 *           type: string
 *           nullable: true
 *           example: Rebuilding the checkout flow.
 *         ownerId:
 *           type: string
 *           format: uuid
 *         visibility:
 *           type: string
 *           enum: [private, public]
 *         isArchived:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export {};
