export const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export const JWT_ALGORITHM = "HS256" as const;

export const BCRYPT_SALT_ROUNDS = 10;

// At least 8 characters, one uppercase, one lowercase, one digit.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

export const AUTH_ERRORS = {
  USER_ALREADY_EXISTS: {
    code: "USER_ALREADY_EXISTS",
    message: "A user with this email already exists",
  },
  INVALID_CREDENTIALS: {
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password",
  },
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    message: "Authentication required",
  },
  INVALID_TOKEN: {
    code: "INVALID_TOKEN",
    message: "Invalid or malformed token",
  },
  INVALID_TOKEN_TYPE: {
    code: "INVALID_TOKEN_TYPE",
    message: "Invalid token type",
  },
  TOKEN_EXPIRED: {
    code: "TOKEN_EXPIRED",
    message: "Token has expired",
  },
  INVALID_TOKEN_VERSION: {
    code: "INVALID_TOKEN_VERSION",
    message: "Token has been revoked",
  },
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User not found",
  },
  ACCOUNT_INACTIVE: {
    code: "ACCOUNT_INACTIVE",
    message: "This account has been deactivated",
  },
} as const;
