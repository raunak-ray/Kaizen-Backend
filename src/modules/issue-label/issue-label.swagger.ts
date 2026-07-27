/**
 * @openapi
 * components:
 *   schemas:
 *     CreateIssueLabelRequest:
 *       type: object
 *       required: [name, color]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: Bug
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           example: "#E11D48"
 *         description:
 *           type: string
 *           maxLength: 255
 *           example: Something isn't working
 *     UpdateIssueLabelRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: Bug
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           example: "#E11D48"
 *         description:
 *           type: string
 *           maxLength: 255
 *     IssueLabelResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         projectId: { type: string, format: uuid }
 *         name: { type: string, example: Bug }
 *         color: { type: string, example: "#E11D48" }
 *         description: { type: string, nullable: true, example: Something isn't working }
 *         archived: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */
export {};
