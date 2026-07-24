# Issues

The Issues module owns the complete lifecycle of work items within a project: creation, retrieval, updates, assignment, status and priority transitions, archiving, restoration, and soft deletion. It is the core aggregate of the platform — future modules (comments, labels, attachments, watchers, activity, notifications, sprint planning) build on top of issues without changing this module's boundaries.

## Structure

```text
issues/
├── issue.controller.ts  # HTTP input/output only
├── issue.service.ts     # business rules and authorization
├── issue.repository.ts  # database access only
├── issue.routes.ts      # authenticated routes and Zod middleware
├── issue.schema.ts      # request validation
├── issue.types.ts
├── issue.constants.ts
└── issue.swagger.ts
```

## Architecture

Controllers use the shared async handler and response helper and contain no business logic. Services validate the project, membership, and assignee, enforce the archived/soft-delete rules, and map rows to responses. Repositories only read and write `tbl_issue`; they never filter soft-deleted rows for anyone but the service to decide.

## Issue lifecycle

Every issue belongs to exactly one project and has exactly one reporter (the authenticated user who created it). Assignment is optional.

```text
Authenticate → Validate Project → Validate Membership → Validate Assignee (optional) → Persist → Return
```

Updating, assigning, changing status, and changing priority all follow the same shape: load the issue, confirm the requester is a project member, and reject the change if the issue is archived.

```text
Authenticate → Load Issue → Validate Membership → Ensure Issue Is Active → Apply Change → Return
```

Archiving does not require the issue to be active; archiving an already-archived issue is idempotent. Restoring requires the issue to currently be archived (`ISSUE_NOT_ARCHIVED` otherwise). Deletion is a soft delete (`deleted_at`) — deleted issues are excluded from every read path and behave as `ISSUE_NOT_FOUND`.

## Assignment workflow

An issue's assignee must be an existing user **and** a member (or the owner) of the issue's project. Assigning a nonexistent user returns `ASSIGNEE_NOT_FOUND`; assigning a user outside the project returns `ASSIGNEE_NOT_A_MEMBER`. Sending `assigneeId: null` to `PATCH /assign` unassigns the issue.

## Status and priority model

| Field    | Values                        | Default  |
| -------- | ----------------------------- | -------- |
| status   | `todo`, `in-progress`, `done` | `todo`   |
| priority | `low`, `medium`, `high`       | `medium` |
| type     | `task`, `bug-fix`             | `task`   |

Status and priority each have a dedicated endpoint so they can be changed independently of the rest of the issue.

## Authorization

Every route requires authentication. Membership is satisfied by being the project owner or by holding a row in `tbl_project_member` for that project; the current implementation does not yet distinguish member roles for issue actions — any member may create, view, update, assign, archive, restore, or delete issues. Fine-grained, role-based permissions belong to a future Permissions module.

## API

All routes use bearer authentication and are mounted under `/projects/:projectId/issues`.

| Method | Path                 | Description                                  |
| ------ | -------------------- | -------------------------------------------- |
| POST   | `/`                  | Create an issue.                             |
| GET    | `/`                  | List project issues (filterable, paginated). |
| GET    | `/:issueId`          | Get a single issue.                          |
| PATCH  | `/:issueId`          | Update title, description, or type.          |
| PATCH  | `/:issueId/assign`   | Assign or unassign an issue.                 |
| PATCH  | `/:issueId/status`   | Change status.                               |
| PATCH  | `/:issueId/priority` | Change priority.                             |
| PATCH  | `/:issueId/archive`  | Archive an issue.                            |
| PATCH  | `/:issueId/restore`  | Restore an archived issue.                   |
| DELETE | `/:issueId`          | Soft delete an issue.                        |

`GET /` accepts optional `status`, `priority`, `type`, `assigneeId`, `archived`, `page`, and `limit` query parameters. Swagger documents every request and response schema at `/api/docs`.

## Extension points

Comments, labels, attachments, watchers, mentions, activity logging, notifications, linked issues, bulk operations, time tracking, and custom fields are all intentionally out of scope here. They should be built as separate modules that react to issue domain events (e.g. issue created, assigned, archived) rather than reaching into this module's repository or service directly.
