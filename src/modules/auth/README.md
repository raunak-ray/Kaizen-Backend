# Authentication Module

Self-contained authentication module for the Kaizen backend: registration, login, access/refresh
tokens, refresh rotation, logout, and `/me`.

## Folder Structure

```
src/modules/auth/
├── auth.controller.ts   # Thin HTTP layer: reads req, calls the service, sends a response
├── auth.service.ts      # All business logic — hashing, JWTs, token rotation, user mapping
├── auth.repository.ts   # Persistence only (Drizzle queries against tbl_user)
├── auth.routes.ts       # Route wiring + per-endpoint Swagger (@openapi) docs
├── auth.middleware.ts   # `authenticate` — Bearer token verification for protected routes
├── auth.schema.ts       # Zod request schemas (register/login/refresh)
├── auth.types.ts        # DTOs, JwtPayload, AuthResponse, req.user augmentation
├── auth.constants.ts    # Token types, JWT algorithm, password regex, error catalogue
├── auth.swagger.ts      # Shared OpenAPI component schemas (securitySchemes, DTOs)
├── README.md
└── __tests__/
    └── auth.test.ts     # Integration tests (supertest, real Postgres)
```

## Authentication Flow

**Register** — validate → check existing email → hash password → create user → issue tokens →
return `{ user, tokens }`.

**Login** — validate → find user by email → compare password → verify account is active → issue
tokens → return `{ user, tokens }`.

**Refresh** — verify refresh token signature, expiry, and type → load user → validate JWT version →
verify account is active → issue a brand new token pair → return `{ accessToken, refreshToken }`.

**Logout** — authenticate → increment `jwt_version` → return success. No token blacklist or session
store is needed; see JWT Versioning below.

**Me** — authenticate → return the authenticated user, re-fetched by `authService.getCurrentUser()`.

## JWT Versioning

Every issued token (access or refresh) carries:

```jsonc
{ "sub": "...", "email": "...", "version": 0, "type": "access", "jti": "..." }
```

`version` is a snapshot of the user's `jwt_version` column at the time the token was issued.
Every verification (in `authenticate` middleware and in `refresh`) re-reads the user's current
`jwt_version` and rejects the token if it doesn't match. `jti` is a random UUID that guarantees
distinct tokens even when two are issued within the same second — required for refresh tokens to
actually change under rotation.

**Logout invalidates every session at once**: incrementing `jwt_version` immediately makes every
previously issued access token and refresh token fail validation, without needing a token blacklist
or server-side session storage.

## Refresh Token Rotation

`POST /auth/refresh` always issues a **new** access token and a **new** refresh token — the
supplied refresh token's version snapshot becomes instantly stale the next time it's used, and
callers must persist the newly returned refresh token to keep their session alive.

## Security Considerations

- Passwords are hashed with bcrypt (10 salt rounds) and never stored or returned in plaintext.
- `password_hash` never appears in any API response — `AuthenticatedUser` only ever contains
  `id`, `email`, `firstName`, `lastName`.
- Tokens are signed with `HS256` and verified with an explicit `algorithms` allowlist to prevent
  algorithm-confusion attacks.
- Access and refresh tokens are structurally identical except for `type`; every verification path
  checks `type` explicitly so an access token can never be used to refresh, and vice versa.
- Expired, malformed, wrong-type, and version-mismatched tokens each return a distinct error code
  to aid debugging without leaking which check failed to a would-be attacker in production logs.
- Deactivated accounts (`is_active = false`) are rejected on login, refresh, and every
  authenticated request, even if their token is otherwise valid.

## Environment Variables

| Variable                 | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `JWT_SECRET`             | HMAC signing secret shared by access & refresh tokens |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime (e.g. `15m`, `1d`)              |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`, `30d`)             |

## API Endpoints

All routes are mounted at `${API_PREFIX}/auth` (e.g. `/api/auth`).

| Method | Path        | Auth required              | Description                                            |
| ------ | ----------- | -------------------------- | ------------------------------------------------------ |
| POST   | `/register` | No                         | Create a user, returns `{ user, tokens }`              |
| POST   | `/login`    | No                         | Authenticate, returns `{ user, tokens }`               |
| POST   | `/refresh`  | No (refresh token in body) | Rotate tokens, returns `{ accessToken, refreshToken }` |
| POST   | `/logout`   | Yes (Bearer access token)  | Invalidate all sessions for the user                   |
| GET    | `/me`       | Yes (Bearer access token)  | Return the authenticated user                          |

Full request/response schemas are documented via Swagger at `/api/docs`.

## Future Extension Points

- Email verification (add an `email_verified_at` column + a verification-token flow).
- Password reset (short-lived, single-purpose reset tokens; same JWT-versioning primitive applies).
- Role-based access control (extend `AuthenticatedUser` and `JwtPayload` with a `role` claim once a
  second module needs it — keep it out of this module until then).
- Rate limiting on `/login` and `/register` to slow down credential stuffing/brute force.
