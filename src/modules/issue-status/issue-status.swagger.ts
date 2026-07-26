/**
 * @openapi
 * components:
 *   schemas:
 *     CreateIssueStatusRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: In Review
 *         category: { type: string, enum: [todo, in-progress, done], default: todo }
 *         position: { type: integer, minimum: 0, example: 3 }
 *     UpdateIssueStatusRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: In Review
 *         category: { type: string, enum: [todo, in-progress, done] }
 *         position: { type: integer, minimum: 0 }
 *     IssueStatusResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         projectId: { type: string, format: uuid }
 *         name: { type: string, example: In Review }
 *         category: { type: string, enum: [todo, in-progress, done] }
 *         position: { type: integer, example: 3 }
 *         archived: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */
export {};
