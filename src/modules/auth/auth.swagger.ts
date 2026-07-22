/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required: [email, password, firstName, lastName]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: jane.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: StrongPass123
 *         firstName:
 *           type: string
 *           example: Jane
 *         lastName:
 *           type: string
 *           example: Doe
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: jane.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: StrongPass123
 *     RefreshRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 *     AuthenticatedUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/AuthenticatedUser'
 *         tokens:
 *           $ref: '#/components/schemas/AuthTokens'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 400
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             message:
 *               type: string
 *             details:
 *               type: object
 */
export {};
