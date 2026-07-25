# Issue Status

The Issue Status module owns the lifecycle states (statuses) available to issues within a
project — creation, listing, retrieval, renaming/reordering, archiving, and restoration. It does
not own workflow transitions, custom workflows, workflow schemes, or permission-based transitions;
those are deferred to future modules so this one stays a simple, self-contained lookup domain.

## Structure

```text
issue-status/
├── issue-status.controller.ts  # HTTP input/output only
├── issue-status.service.ts     # business rules and authorization
├── issue-status.repository.ts  # database access only
├── issue-status.routes.ts      # authenticated routes and Zod middleware
├── issue-status.schema.ts      # request validation
├── issue-status.types.ts
├── issue-status.constants.ts
└── issue-status.swagger.ts
```

## Architecture

Controllers use the shared async handler and response helper and contain no business logic.
The service validates the project, enforces owner-only authorization on writes, enforces
per-project name uniqueness, and maps rows to responses. The repository only reads and writes
`tbl_issue_status`; it never filters archived rows for anyone but the service to decide (archived
statuses must remain readable so they can be found and restored).

## Default statuses

`DEFAULT_STATUSES` in `issue-status.constants.ts` defines the four statuses every project is
expected to start with: `Todo` (category `todo`), `In Progress` and `Review` (category
`in-progress`), and `Done` (category `done`). Automatically seeding these when a project is
created is a future integration — this module only defines the constant and the CRUD to manage
statuses, it does not yet wire itself into project creation.

## Status lifecycle

```text
Authenticate → Validate Project → Validate Owner → Ensure Name Is Unique → Persist → Return
```

Updating follows the same shape, loading the status first and re-checking uniqueness only if the
name is being changed:

```text
Authenticate → Load Status → Validate Owner → Ensure Name Is Unique (if renaming) → Update → Return
```

Archiving does not require the status to be active; archiving an already-archived status is
idempotent. Restoring requires the status to currently be archived (`STATUS_NOT_ARCHIVED`
otherwise). There is no delete endpoint — statuses are only ever archived/restored, since issues
may still reference an archived status's id.

## Position

`position` controls display order within a project. If omitted on create, it defaults to one past
the current highest position in that project (i.e. new statuses append to the end of the list).

## Authorization

Every route requires authentication. Only the project owner may create, update, archive, or
restore statuses. Any project member (or the owner) may list or read them. This mirrors the
Issues module's placeholder authorization model ahead of a future role-based Permissions module.

## API

All routes use bearer authentication and are mounted under `/projects/:projectId/statuses`.

| Method | Path                 | Description                      |
| ------ | -------------------- | -------------------------------- |
| POST   | `/`                  | Create a status.                 |
| GET    | `/`                  | List a project's statuses.       |
| GET    | `/:statusId`         | Get a single status.             |
| PATCH  | `/:statusId`         | Update name, category, position. |
| PATCH  | `/:statusId/archive` | Archive a status.                |
| PATCH  | `/:statusId/restore` | Restore an archived status.      |

Swagger documents every request and response schema at `/api/docs`.

## Extension points

Custom workflows, workflow transitions, workflow schemes, conditional and permission-based
transitions, and default project templates (auto-seeding `DEFAULT_STATUSES` on project creation)
are all intentionally out of scope here. They should be built as separate modules that react to
or read from this one rather than reaching into its repository or service directly.
