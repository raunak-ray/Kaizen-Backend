/**
 * @openapi
 * components:
 *   schemas:
 *     CreateIssueTypeRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Bug
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: A defect to fix
 *         icon:
 *           type: string
 *           maxLength: 50
 *           example: bug
 *     UpdateIssueTypeRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Bug
 *         description:
 *           type: string
 *           maxLength: 500
 *         icon:
 *           type: string
 *           maxLength: 50
 *     IssueTypeResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         projectId: { type: string, format: uuid }
 *         name: { type: string, example: Bug }
 *         description: { type: string, nullable: true, example: A defect to fix }
 *         icon: { type: string, nullable: true, example: bug }
 *         archived: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */
export {};
