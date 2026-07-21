import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "@config/env";
import { AppError } from "@/lib/errors";
import * as authRepository from "./auth.repository";
import type { AuthUserRow } from "./auth.repository";
import { AUTH_ERRORS, BCRYPT_SALT_ROUNDS, JWT_ALGORITHM, TOKEN_TYPES } from "./auth.constants";
import type {
  AuthenticatedUser,
  AuthResponse,
  AuthTokens,
  JwtPayload,
  LoginDto,
  RefreshDto,
  RegisterDto,
  TokenType,
} from "./auth.types";

class AuthService {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await authRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new AppError(
        AUTH_ERRORS.USER_ALREADY_EXISTS.message,
        409,
        AUTH_ERRORS.USER_ALREADY_EXISTS.code,
      );
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await authRepository.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return {
      user: this.mapUser(user),
      tokens: this.generateTokens(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await authRepository.findByEmail(dto.email);

    if (!user) {
      throw new AppError(
        AUTH_ERRORS.INVALID_CREDENTIALS.message,
        401,
        AUTH_ERRORS.INVALID_CREDENTIALS.code,
      );
    }

    const isPasswordValid = await this.comparePassword(dto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError(
        AUTH_ERRORS.INVALID_CREDENTIALS.message,
        401,
        AUTH_ERRORS.INVALID_CREDENTIALS.code,
      );
    }

    if (!user.is_active) {
      throw new AppError(
        AUTH_ERRORS.ACCOUNT_INACTIVE.message,
        403,
        AUTH_ERRORS.ACCOUNT_INACTIVE.code,
      );
    }

    return {
      user: this.mapUser(user),
      tokens: this.generateTokens(user),
    };
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(dto.refreshToken);

    const user = await authRepository.findById(payload.sub);

    if (!user) {
      throw new AppError(AUTH_ERRORS.USER_NOT_FOUND.message, 401, AUTH_ERRORS.USER_NOT_FOUND.code);
    }

    this.validateJwtVersion(user, payload.version);

    if (!user.is_active) {
      throw new AppError(
        AUTH_ERRORS.ACCOUNT_INACTIVE.message,
        403,
        AUTH_ERRORS.ACCOUNT_INACTIVE.code,
      );
    }

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await authRepository.incrementJwtVersion(userId);
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(AUTH_ERRORS.USER_NOT_FOUND.message, 404, AUTH_ERRORS.USER_NOT_FOUND.code);
    }

    return this.mapUser(user);
  }

  /**
   * Verifies an access token and loads its owner. Used by the authentication
   * middleware, which must not contain JWT or persistence logic itself.
   */
  async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    const payload = this.verifyAccessToken(token);

    const user = await authRepository.findById(payload.sub);

    if (!user) {
      throw new AppError(AUTH_ERRORS.USER_NOT_FOUND.message, 401, AUTH_ERRORS.USER_NOT_FOUND.code);
    }

    this.validateJwtVersion(user, payload.version);

    if (!user.is_active) {
      throw new AppError(
        AUTH_ERRORS.ACCOUNT_INACTIVE.message,
        403,
        AUTH_ERRORS.ACCOUNT_INACTIVE.code,
      );
    }

    return this.mapUser(user);
  }

  private generateTokens(user: AuthUserRow): AuthTokens {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: AuthUserRow): string {
    return this.signToken(user, TOKEN_TYPES.ACCESS, env.JWT_ACCESS_EXPIRES_IN);
  }

  private generateRefreshToken(user: AuthUserRow): string {
    return this.signToken(user, TOKEN_TYPES.REFRESH, env.JWT_REFRESH_EXPIRES_IN);
  }

  private signToken(user: AuthUserRow, type: TokenType, expiresIn: string): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      version: user.jwt_version,
      type,
      jti: randomUUID(),
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: expiresIn as SignOptions["expiresIn"],
      algorithm: JWT_ALGORITHM,
    });
  }

  private verifyAccessToken(token: string): JwtPayload {
    return this.verifyToken(token, TOKEN_TYPES.ACCESS);
  }

  private verifyRefreshToken(token: string): JwtPayload {
    return this.verifyToken(token, TOKEN_TYPES.REFRESH);
  }

  private verifyToken(token: string, expectedType: TokenType): JwtPayload {
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
      }) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(AUTH_ERRORS.TOKEN_EXPIRED.message, 401, AUTH_ERRORS.TOKEN_EXPIRED.code);
      }

      throw new AppError(AUTH_ERRORS.INVALID_TOKEN.message, 401, AUTH_ERRORS.INVALID_TOKEN.code);
    }

    if (payload.type !== expectedType) {
      throw new AppError(
        AUTH_ERRORS.INVALID_TOKEN_TYPE.message,
        401,
        AUTH_ERRORS.INVALID_TOKEN_TYPE.code,
      );
    }

    return payload;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private mapUser(user: AuthUserRow): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }

  private validateJwtVersion(user: AuthUserRow, tokenVersion: number): void {
    if (user.jwt_version !== tokenVersion) {
      throw new AppError(
        AUTH_ERRORS.INVALID_TOKEN_VERSION.message,
        401,
        AUTH_ERRORS.INVALID_TOKEN_VERSION.code,
      );
    }
  }
}

export const authService = new AuthService();
