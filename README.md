# Kaizen Backend

Production-ready Express + TypeScript backend for Kaizen, a project/issue-tracking product. Ships
with a foundation scaffold (config, error handling, response envelope, validation) plus four
complete domain modules:

| Module          | Owns                                                                   | Module README                                                                    |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Authentication  | Accounts, JWT sessions, rate limiting, audit logging                   | [`src/modules/auth/README.md`](src/modules/auth/README.md)                       |
| Projects        | Project creation, ownership, visibility, archiving                     | [`src/modules/projects/README.md`](src/modules/projects/README.md)               |
| Project Members | Project-scoped membership and roles                                    | [`src/modules/project-members/README.md`](src/modules/project-members/README.md) |
| Issues          | Work item lifecycle: create, assign, status, priority, archive, delete | [`src/modules/issues/README.md`](src/modules/issues/README.md)                   |

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

| Variable                 | Description                                     | Default       |
| ------------------------ | ----------------------------------------------- | ------------- |
| `NODE_ENV`               | `development` \| `test` \| `production`         | `development` |
| `PORT`                   | HTTP port                                       | `5000`        |
| `API_PREFIX`             | Prefix reserved for future API routes           | `/api`        |
| `DATABASE_URL`           | PostgreSQL connection string                    | —             |
| `CORS_ORIGIN`            | Allowed origin(s), comma-separated, or `*`      | `*`           |
| `LOG_LEVEL`              | Pino log level                                  | `info`        |
| `COOKIE_DOMAIN`          | Domain for cookies                              | —             |
| `COOKIE_SECURE`          | `true` \| `false`                               | `false`       |
| `COOKIE_SAME_SITE`       | `lax` \| `strict` \| `none`                     | `lax`         |
| `JWT_SECRET`             | HMAC signing secret for access & refresh tokens | —             |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime (e.g. `15m`, `1d`)        | —             |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`, `30d`)       | —             |

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

Schemas live in `db/schema/`, generated SQL migrations in `db/migrations/`. Current tables:
`tbl_user`, `tbl_project`, `tbl_project_member`, `tbl_issue` — one schema file per module, each
exported from `db/schema/index.ts`. Future modules add their schema files here the same way.

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
`GET /health`. Each module keeps its own integration tests alongside its code in a `__tests__/`
folder (e.g. `src/modules/issues/__tests__/issue.test.ts`) — copy that structure for future
modules. Tests run against a real PostgreSQL database (`DATABASE_URL` under `NODE_ENV=test`), so
run `npm run db:migrate` against that database before running tests for the first time or after
adding a migration.

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
├── docs/                 # per-module overview/architecture/security/roadmap docs
│   ├── auth/
│   ├── projects/
│   ├── project-members/
│   └── issues/
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
│   └── modules/
│       ├── auth/            # registration, login, refresh rotation, logout, /me
│       ├── projects/        # project creation, ownership, visibility, archiving
│       ├── project-members/ # project-scoped membership and roles
│       └── issues/           # issue lifecycle: create, assign, status, priority, archive, delete
│           └── README.md    # per-module: implementation reference, folder-by-folder
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
{ "success": true, "statusCode": 200, "message": "...", "data": { } }

// failure
{ "success": false, "statusCode": 400, "error": { "code": "...", "message": "..." } }
```

Use `successResponse(res, statusCode, message, data)` / `errorResponse(res, statusCode, code, message, details?)`
from `src/lib/responses` and throw `AppError` from `src/lib/errors` in future modules to stay
consistent with this format.

## Modules

Each domain module below has two layers of documentation: a `README.md` inside the module
(implementation reference — what each file does) and a `docs/<module>/` set (overview, architecture,
security, roadmap — the "why" behind the design, written for both technical and non-technical
readers).

### Authentication

A complete Authentication module lives at `src/modules/auth/` — registration, login, `/me`,
access/refresh tokens with rotation, JWT versioning (so logout invalidates every issued token
without a blacklist), rate limiting, and audit logging.

- New to the project or non-technical? Start with [`docs/auth/overview.md`](docs/auth/overview.md).
- Working in the code? See [`src/modules/auth/README.md`](src/modules/auth/README.md) for the
  full flow, security considerations, and endpoint reference.
- Full docs set: [`docs/auth/`](docs/auth/overview.md) (overview, architecture, security, roadmap).

### Projects

A complete Projects module lives at `src/modules/projects/` — project creation with an
auto-generated unique key, ownership, `private`/`public` visibility, archiving, and deletion.

- New to the project or non-technical? Start with
  [`docs/projects/overview.md`](docs/projects/overview.md).
- Working in the code? See [`src/modules/projects/README.md`](src/modules/projects/README.md).
- Full docs set: [`docs/projects/`](docs/projects/overview.md).

### Project Members

A complete Project Members module lives at `src/modules/project-members/` — inviting existing
users into a project, listing members, changing a member's role, and removing members. Project
metadata itself stays owned by the Projects module.

- New to the project or non-technical? Start with
  [`docs/project-members/overview.md`](docs/project-members/overview.md).
- Working in the code? See
  [`src/modules/project-members/README.md`](src/modules/project-members/README.md).
- Full docs set: [`docs/project-members/`](docs/project-members/overview.md).

### Issues

A complete Issues module lives at `src/modules/issues/` — the platform's core aggregate. Owns
issue creation, retrieval, listing/filtering, updates, assignment, status and priority
transitions, archiving, restoration, and soft deletion, scoped to a project and gated on project
membership.

- New to the project or non-technical? Start with
  [`docs/issues/overview.md`](docs/issues/overview.md).
- Working in the code? See [`src/modules/issues/README.md`](src/modules/issues/README.md).
- Full docs set: [`docs/issues/`](docs/issues/overview.md).
