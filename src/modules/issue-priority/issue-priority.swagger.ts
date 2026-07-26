/**
 * @openapi
 * components:
 *   schemas:
 *     CreateIssuePriorityRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Critical
 *         level: { type: integer, minimum: 0, example: 1 }
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           example: '#CD1F1F'
 *     UpdateIssuePriorityRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Critical
 *         level: { type: integer, minimum: 0 }
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *     IssuePriorityResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         projectId: { type: string, format: uuid }
 *         name: { type: string, example: Critical }
 *         level: { type: integer, example: 1 }
 *         color: { type: string, example: '#CD1F1F' }
 *         archived: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */
export {};
