# Issue Status — Security

**Audience:** developers, technical leads, and anyone evaluating the security posture of this
system. Assumes you've read [`overview.md`](overview.md); this document goes deeper on _why_ each
control exists, not just that it does.

## At a glance

| Control                                     | Protects against                                                                  | Where                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| `authenticate` required on every route      | Anonymous access to any status data                                               | `issue-status.routes.ts`                  |
| Owner-only authorization on writes          | Any member reshaping a project's workflow, not just the person accountable for it | `issue-status.service.ts`                 |
| Membership required on reads                | A stranger with a valid account reading a project's statuses                      | `issue-status.service.ts`                 |
| Per-project name uniqueness, enforced twice | Two statuses with the same name in one project, even under a race                 | `issue-status.service.ts` + DB constraint |
| Archived statuses remain readable           | A status becoming permanently unrecoverable once archived                         | `issue-status.repository.ts`              |
| No delete endpoint, only archive/restore    | A status id referenced elsewhere becoming a dangling reference                    | `issue-status.repository.ts`              |
| Operational logging on every operation      | "What happened to this status?" being unanswerable after the fact                 | `issue-status.service.ts`                 |

## Authentication is required everywhere

`issueStatusRouter.use(authenticate)` runs before every route in this module, the same default
every other module in this codebase uses — there is no public read path for status data.

## Membership for reads, ownership for writes

This is a deliberate departure from [Issues](../issues/security.md#membership-not-ownership-is-the-authorization-boundary),
where any project member has equal authority over issues. Here, `findById` and `findAll` accept
any project member (owner or otherwise, via `validateMembership`), but `create`, `update`,
`archive`, and `restore` all require the requester to be the project **owner** (`validateOwner`).

The reasoning: a status list defines the shape of the workflow every member of the project has to
work within. Letting any member add, rename, or archive statuses would mean one member could
silently change what "done" means for everyone else mid-project. Reading the list carries no such
risk, so it stays as open as Issues' membership check. This is still a placeholder ahead of a real
Permissions module — see [`roadmap.md`](roadmap.md) for how owner-only would become
role-based without changing the public API.

## Per-project name uniqueness is enforced twice

`ensureUniqueName` in the service checks `findByName(projectId, name)` before every create and
rename, but the database also carries a `unique(project_id, name)` constraint on `tbl_issue_status`
(see `db/schema/issue_status.schema.ts`). The service-level check exists to return a clean
`409 STATUS_ALREADY_EXISTS` through the normal error path; the database constraint exists as a
backstop against a race between two concurrent requests slipping past that check at the same
instant — a scenario the application-level check alone cannot fully close.

## Archived statuses remain readable

`findById` and `findMany` in `issue-status.repository.ts` never filter on `archived`. This is the
opposite instinct from typical soft-delete filtering, and deliberately so: if archived rows were
hidden from reads, `restore()` would have no way to locate the status it's meant to bring back, and
an issue that still references an archived status id would have no way to display its name. Only
the _write_ paths (`create`, `update`, `archive`) care about `archived`, and only `restore` cares
whether it's currently `true`.

## No delete endpoint, only archive and restore

Unlike [Issues](../issues/security.md#soft-delete-is-a-data-lifecycle-control-not-an-access-control),
which supports a soft `DELETE` via `deleted_at`, this module has no delete path and
`tbl_issue_status` has no `deleted_at` column at all. A status id is meant to be permanent once
issued, because other rows (an issue's `status_id` once that link exists, and any future workflow
transition or scheme referencing a status by id — see [`roadmap.md`](roadmap.md)) may depend on it
always resolving to something. Archiving is the only retirement path, and it never removes the row.

## Operational logging

Every meaningful operation in `issue-status.service.ts` — create, update, archive, restore, and
every rejected attempt (not found, not owner, not a member, name conflict, restore-not-archived) —
is written as a structured log line through the shared Pino `logger`, with `projectId`, `statusId`
(where applicable), and `userId`. Reads (`findById`, `findAll`) log at `debug` on success, matching
[Issues' logging levels](../issues/security.md#operational-logging).

This follows the same reasoning as [Issues' operational logging](../issues/security.md#operational-logging):
it's for day-to-day traceability, not a security-incident audit trail. If status changes later
become a compliance question, that should adopt `AuditLogger` (`src/lib/audit/`) rather than
growing a parallel mechanism here.

**What's never logged:** status `name` content or full request bodies — only identifiers and the
outcome.

## See also

- [`overview.md`](overview.md) — plain-language explanation of what's being protected and why
- [`architecture.md`](architecture.md) — how these controls fit into the request flow, including the logging levels used
- [`roadmap.md`](roadmap.md) — security-relevant work intentionally deferred (role-based status permissions)
- [`src/modules/issue-status/README.md`](../../src/modules/issue-status/README.md) — implementation reference
