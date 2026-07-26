# Issue Priority

The Issue Priority module owns the priorities available to issues within a project — creation,
listing, retrieval, renaming/reordering, archiving, and restoration. It does not own priority
rules, SLA automation, escalation policies, or workflow integration; those are deferred to future
modules so this one stays a simple, self-contained lookup domain.

> Looking for the "why" behind these decisions, or a non-technical explanation? See
> [`docs/issue-priority/`](../../../docs/issue-priority/overview.md). This README covers the "what"
> and "how" for developers working in this module.

## Structure

```text
issue-priority/
├── issue-priority.controller.ts  # HTTP input/output only
├── issue-priority.service.ts     # business rules and authorization
├── issue-priority.repository.ts  # database access only
├── issue-priority.routes.ts      # authenticated routes and Zod middleware
├── issue-priority.schema.ts      # request validation
├── issue-priority.types.ts
├── issue-priority.constants.ts
└── issue-priority.swagger.ts
```

## Architecture

Controllers use the shared async handler and response helper and contain no business logic.
The service validates the project, enforces owner-only authorization on writes, enforces
per-project name uniqueness, and maps rows to responses. The repository only reads and writes
`tbl_issue_priority`; it never filters archived rows for anyone but the service to decide (archived
priorities must remain readable so they can be found and restored).

## Default priorities

`DEFAULT_PRIORITIES` in `issue-priority.constants.ts` defines the five priorities every project is
expected to start with, from most to least urgent: `Highest` (level 1), `High` (level 2), `Medium`
(level 3), `Low` (level 4), and `Lowest` (level 5). Automatically seeding these when a project is
created is a future integration — this module only defines the constant and the CRUD to manage
priorities, it does not yet wire itself into project creation.

## Priority lifecycle

```text
Authenticate → Validate Project → Validate Owner → Ensure Name Is Unique → Persist → Return
```

Updating follows the same shape, loading the priority first and re-checking uniqueness only if the
name is being changed:

```text
Authenticate → Load Priority → Validate Owner → Ensure Name Is Unique (if renaming) → Update → Return
```

Archiving does not require the priority to be active; archiving an already-archived priority is
idempotent. Restoring requires the priority to currently be archived (`PRIORITY_NOT_ARCHIVED`
otherwise). There is no delete endpoint — priorities are only ever archived/restored, since issues
may still reference an archived priority's id. Archived priorities cannot be assigned to new
issues (a rule owned by the future Issues integration, not enforced here).

## Level and color

`level` controls ranking within a project — a lower numeric level indicates a higher priority. If
omitted on create, it defaults to one past the current highest level in that project (i.e. new
priorities append to the low-urgency end of the list). `color` is a `#RRGGBB` hex code; if omitted
it defaults to a neutral gray (`#6B7280`).

## Authorization

Every route requires authentication. Only the project owner may create, update, archive, or
restore priorities. Any project member (or the owner) may list or read them. This mirrors the
Issue Status module's placeholder authorization model ahead of a future role-based Permissions
module.

## API

All routes use bearer authentication and are mounted under `/projects/:projectId/priorities`.

| Method | Path                   | Description                   |
| ------ | ---------------------- | ----------------------------- |
| POST   | `/`                    | Create a priority.            |
| GET    | `/`                    | List a project's priorities.  |
| GET    | `/:priorityId`         | Get a single priority.        |
| PATCH  | `/:priorityId`         | Update name, level, color.    |
| PATCH  | `/:priorityId/archive` | Archive a priority.           |
| PATCH  | `/:priorityId/restore` | Restore an archived priority. |

Swagger documents every request and response schema at `/api/docs`.

## Extension points

SLA policies, escalation rules, custom icons, organization-wide priority templates,
permission-based priority management, and default project templates (auto-seeding
`DEFAULT_PRIORITIES` on project creation) are all intentionally out of scope here. They should be
built as separate modules that react to or read from this one rather than reaching into its
repository or service directly.
