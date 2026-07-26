# Issue Type

The Issue Type module owns the types available to issues within a project — creation, listing,
retrieval, renaming, archiving, and restoration. It does not own issue type hierarchies, issue
type schemes, screen schemes, or organization-wide templates; those are deferred to future modules
so this one stays a simple, self-contained lookup domain.

> Looking for the "why" behind these decisions, or a non-technical explanation? See
> [`docs/issue-type/`](../../../docs/issue-type/overview.md). This README covers the "what" and
> "how" for developers working in this module.

## Structure

```text
issue-type/
├── issue-type.controller.ts  # HTTP input/output only
├── issue-type.service.ts     # business rules and authorization
├── issue-type.repository.ts  # database access only
├── issue-type.routes.ts      # authenticated routes and Zod middleware
├── issue-type.schema.ts      # request validation
├── issue-type.types.ts
├── issue-type.constants.ts
└── issue-type.swagger.ts
```

## Architecture

Controllers use the shared async handler and response helper and contain no business logic.
The service validates the project, enforces owner-only authorization on writes, enforces
per-project name uniqueness, and maps rows to responses. The repository only reads and writes
`tbl_issue_type`; it never filters archived rows for anyone but the service to decide (archived
types must remain readable so they can be found and restored).

## Default types

`DEFAULT_TYPES` in `issue-type.constants.ts` defines the six types every project is expected to
start with: `Task`, `Bug`, `Story`, `Epic`, `Spike`, and `Improvement`. Automatically seeding these
when a project is created is a future integration — this module only defines the constant and the
CRUD to manage types, it does not yet wire itself into project creation.

## Type lifecycle

```text
Authenticate → Validate Project → Validate Owner → Ensure Name Is Unique → Persist → Return
```

Updating follows the same shape, loading the type first and re-checking uniqueness only if the
name is being changed:

```text
Authenticate → Load Type → Validate Owner → Ensure Name Is Unique (if renaming) → Update → Return
```

Archiving does not require the type to be active; archiving an already-archived type is
idempotent. Restoring requires the type to currently be archived (`TYPE_NOT_ARCHIVED` otherwise).
There is no delete endpoint — types are only ever archived/restored, since issues may still
reference an archived type's id. Archived types cannot be assigned to new issues (a rule owned by
the future Issues integration, not enforced here).

## Description and icon

`description` and `icon` are both optional, free-text fields with no default — a type created
without them stores `null` for each. Neither is interpreted by this module; they exist so a future
UI can label and visually tag a type.

## Authorization

Every route requires authentication. Only the project owner may create, update, archive, or
restore types. Any project member (or the owner) may list or read them. This mirrors the Issue
Status and Issue Priority modules' placeholder authorization model ahead of a future role-based
Permissions module.

## API

All routes use bearer authentication and are mounted under `/projects/:projectId/types`.

| Method | Path               | Description                     |
| ------ | ------------------ | ------------------------------- |
| POST   | `/`                | Create a type.                  |
| GET    | `/`                | List a project's types.         |
| GET    | `/:typeId`         | Get a single type.              |
| PATCH  | `/:typeId`         | Update name, description, icon. |
| PATCH  | `/:typeId/archive` | Archive a type.                 |
| PATCH  | `/:typeId/restore` | Restore an archived type.       |

Swagger documents every request and response schema at `/api/docs`.

## Extension points

Issue type hierarchies, issue type schemes, screen schemes, organization-wide templates, custom
metadata, and default project templates (auto-seeding `DEFAULT_TYPES` on project creation) are all
intentionally out of scope here. They should be built as separate modules that react to or read
from this one rather than reaching into its repository or service directly.
