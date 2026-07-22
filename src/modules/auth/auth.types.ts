import type { TOKEN_TYPES } from "./auth.constants";

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

export interface JwtPayload {
  sub: string;
  email: string;
  version: number;
  type: TokenType;
  jti: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}
