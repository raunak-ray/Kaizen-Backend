# Issue Label

The Issue Label module owns the reusable labels available to issues within a project —
creation, listing, retrieval, renaming, archiving, and restoration. It does not own assigning
labels to issues, automatic labeling, organization-wide labels, label groups, or AI-generated
labels; those are deferred to future modules so this one stays a simple, self-contained lookup
domain.

## Structure

```text
issue-label/
├── issue-label.controller.ts  # HTTP input/output only
├── issue-label.service.ts     # business rules and authorization
├── issue-label.repository.ts  # database access only
├── issue-label.routes.ts      # authenticated routes and Zod middleware
├── issue-label.schema.ts      # request validation
├── issue-label.types.ts
├── issue-label.constants.ts
└── issue-label.swagger.ts
```

## Architecture

Controllers use the shared async handler and response helper and contain no business logic.
The service validates the project, enforces owner-only authorization on writes, enforces
per-project name uniqueness, and maps rows to responses. The repository only reads and writes
`tbl_issue_label`; it never filters archived rows for anyone but the service to decide (archived
labels must remain readable so they can be found and restored).

## Default labels

Unlike the Issue Type module, this module does not define or seed any default labels. Projects
start with no labels — they are created by project owners as needed.

## Label lifecycle

```text
Authenticate → Validate Project → Validate Owner → Ensure Name Is Unique → Persist → Return
```

Updating follows the same shape, loading the label first and re-checking uniqueness only if the
name is being changed:

```text
Authenticate → Load Label → Validate Owner → Ensure Name Is Unique (if renaming) → Update → Return
```

Archiving does not require the label to be active; archiving an already-archived label is
idempotent. Restoring requires the label to currently be archived (`LABEL_NOT_ARCHIVED`
otherwise). There is no delete endpoint — labels are only ever archived/restored, since issues
may still reference an archived label's id. Archived labels cannot be assigned to new issues (a
rule owned by the future Issues integration, not enforced here).

## Color and description

`color` is a required hex string (`#RRGGBB`). `description` is optional, free-text, with no
default — a label created without one stores `null`. Neither is interpreted by this module; they
exist so a future UI can visually tag and describe a label.

## Authorization

Every route requires authentication. Only the project owner may create, update, archive, or
restore labels. Any project member (or the owner) may list or read them. This mirrors the Issue
Type, Priority, and Status modules' placeholder authorization model ahead of a future role-based
Permissions module.

## API

All routes use bearer authentication and are mounted under `/projects/:projectId/labels`.

| Method | Path                | Description                      |
| ------ | ------------------- | -------------------------------- |
| POST   | `/`                 | Create a label.                  |
| GET    | `/`                 | List a project's labels.         |
| GET    | `/:labelId`         | Get a single label.              |
| PATCH  | `/:labelId`         | Update name, color, description. |
| PATCH  | `/:labelId/archive` | Archive a label.                 |
| PATCH  | `/:labelId/restore` | Restore an archived label.       |

Swagger documents every request and response schema at `/api/docs`.

## Extension points

Label assignment to issues, automatic labeling, organization-wide labels, label groups,
AI-generated labels, label templates, and label usage analytics are all intentionally out of
scope here. They should be built as separate modules that react to or read from this one rather
than reaching into its repository or service directly.
