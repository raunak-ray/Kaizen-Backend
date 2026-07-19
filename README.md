# Kaizen Backend

Production-ready Express + TypeScript backend foundation. No business logic, authentication, or
database schema is implemented here — this is the scaffold every future module builds on.

## Stack

Express · TypeScript · PostgreSQL · Drizzle ORM · Zod · Pino · Swagger · Vitest · ESLint · Prettier · Husky

## Installation

```bash
npm install
```

## Environment Setup

Copy the example file and fill in your local values:

```bash
cp .env.example .env
```

| Variable           | Description                                | Default       |
| ------------------ | ------------------------------------------ | ------------- |
| `NODE_ENV`         | `development` \| `test` \| `production`    | `development` |
| `PORT`             | HTTP port                                  | `5000`        |
| `API_PREFIX`       | Prefix reserved for future API routes      | `/api`        |
| `DATABASE_URL`     | PostgreSQL connection string               | —             |
| `CORS_ORIGIN`      | Allowed origin(s), comma-separated, or `*` | `*`           |
| `LOG_LEVEL`        | Pino log level                             | `info`        |
| `COOKIE_DOMAIN`    | Domain for cookies                         | —             |
| `COOKIE_SECURE`    | `true` \| `false`                          | `false`       |
| `COOKIE_SAME_SITE` | `lax` \| `strict` \| `none`                | `lax`         |

Environment variables are validated with Zod on startup (`config/env.ts`). The app refuses to
start if configuration is invalid or missing.

## Running Locally

Requires a running PostgreSQL instance reachable at `DATABASE_URL`.

```bash
npm run dev     # start with auto-reload
npm start       # start without watch mode
```

On boot the server verifies the database connection, then starts listening. `SIGINT`/`SIGTERM`
trigger a graceful shutdown (HTTP server closes, then the database connection closes).

## Database Commands

```bash
npm run db:generate   # generate Drizzle migrations from db/schema
npm run db:migrate    # run pending migrations against DATABASE_URL
npm run db:studio     # open Drizzle Studio
```

Schemas live in `db/schema/`, generated SQL migrations in `db/migrations/`. No tables are defined
yet — future modules add their schema files here.

## API Documentation

Swagger UI is available at:

```
http://localhost:5000/api/docs
```

Route handlers document themselves via `@openapi` JSDoc comments (see `src/routes/health.ts` for
an example). Swagger works out of the box, before any modules are added.

## Testing

```bash
npm test         # run once
npm run test:watch
```

Tests use Vitest + Supertest. `tests/health.test.ts` is the baseline integration test for
`GET /health` — copy its structure for future route tests.

## Development Workflow

```bash
npm run lint      # eslint .
npm run format    # prettier --write .
npm run typecheck # tsc --noEmit
```

A Husky pre-commit hook runs `lint-staged` (Prettier + ESLint on staged files) and a full
`tsc --noEmit` type check. Commits are blocked if any check fails.

## Project Structure

```
backend/
├── config/            # env, logger, swagger, security configuration
│   ├── env.ts
│   ├── logger.ts
│   ├── swagger.ts
│   └── security.ts
│
├── db/
│   ├── client.ts       # Postgres + Drizzle client
│   ├── schema/          # Drizzle table definitions (per module)
│   └── migrations/      # generated SQL migrations
│
├── docs/
│
├── src/
│   ├── app.ts           # Express app: middleware, swagger, routes, error handling
│   ├── server.ts         # env load, db connect, listen, graceful shutdown
│   │
│   ├── lib/
│   │   ├── errors/       # AppError + global error handler
│   │   ├── middleware/   # request id, etc.
│   │   ├── responses/    # success/error response helpers
│   │   └── validators/   # zod request validation middleware
│   │
│   ├── utils/
│   ├── routes/
│   │   └── health.ts
│   └── modules/          # future feature modules (auth, orgs, projects, ...)
│
├── tests/
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Response Format

Every endpoint returns the same envelope:

```jsonc
// success
{ "success": true, "data": { }, "error": null }

// failure
{ "success": false, "data": null, "error": { "code": "...", "message": "..." } }
```

Use `successResponse` / `errorResponse` from `src/lib/responses` and throw `AppError` from
`src/lib/errors` in future modules to stay consistent with this format.
