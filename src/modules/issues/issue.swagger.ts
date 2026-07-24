/**
 * @openapi
 * components:
 *   schemas:
 *     CreateIssueRequest:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: Fix login redirect loop
 *         description:
 *           type: string
 *           maxLength: 2000
 *           example: Users are redirected back to /login after a successful sign in.
 *         assigneeId: { type: string, format: uuid }
 *         status: { type: string, enum: [todo, in-progress, done], default: todo }
 *         priority: { type: string, enum: [low, medium, high], default: medium }
 *         type: { type: string, enum: [task, bug-fix], default: task }
 *     UpdateIssueRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: Fix login redirect loop
 *         description:
 *           type: string
 *           maxLength: 2000
 *           example: Users are redirected back to /login after a successful sign in.
 *         type: { type: string, enum: [task, bug-fix] }
 *     AssignIssueRequest:
 *       type: object
 *       required: [assigneeId]
 *       properties:
 *         assigneeId: { type: string, format: uuid, nullable: true }
 *     ChangeIssueStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status: { type: string, enum: [todo, in-progress, done], example: in-progress }
 *     ChangeIssuePriorityRequest:
 *       type: object
 *       required: [priority]
 *       properties:
 *         priority: { type: string, enum: [low, medium, high], example: high }
 *     IssueResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         projectId: { type: string, format: uuid }
 *         reporterId: { type: string, format: uuid }
 *         assigneeId: { type: string, format: uuid, nullable: true }
 *         title: { type: string, example: Fix login redirect loop }
 *         description: { type: string, nullable: true }
 *         status: { type: string, enum: [todo, in-progress, done] }
 *         priority: { type: string, enum: [low, medium, high] }
 *         type: { type: string, enum: [task, bug-fix] }
 *         archived: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     IssueListResponse:
 *       type: object
 *       properties:
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueResponse'
 *         total: { type: integer, example: 1 }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 */
export {};
