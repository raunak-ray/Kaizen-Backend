/**
 * @openapi
 * components:
 *   schemas:
 *     InviteProjectMemberRequest:
 *       type: object
 *       required: [userId]
 *       properties:
 *         userId: { type: string, format: uuid }
 *         role: { type: string, enum: [owner, admin, member, viewer], default: member }
 *     UpdateProjectMemberRoleRequest:
 *       type: object
 *       required: [role]
 *       properties:
 *         role: { type: string, enum: [owner, admin, member, viewer], example: admin }
 *     ProjectMemberResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         projectId: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         role: { type: string, enum: [owner, admin, member, viewer] }
 *         createdAt: { type: string, format: date-time }
 *         user:
 *           type: object
 *           properties:
 *             id: { type: string, format: uuid }
 *             firstName: { type: string, example: Jane }
 *             lastName: { type: string, example: Doe }
 *             email: { type: string, format: email, example: jane@example.com }
 */
export {};
