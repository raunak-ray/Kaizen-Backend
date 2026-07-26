# Issue Type — Security

**Audience:** developers, technical leads, and anyone evaluating the security posture of this
system. Assumes you've read [`overview.md`](overview.md); this document goes deeper on _why_ each
control exists, not just that it does.

## At a glance

| Control                                     | Protects against                                                                   | Where                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| `authenticate` required on every route      | Anonymous access to any type data                                                  | `issue-type.routes.ts`                  |
| Owner-only authorization on writes          | Any member reshaping a project's type list, not just the person accountable for it | `issue-type.service.ts`                 |
| Membership required on reads                | A stranger with a valid account reading a project's types                          | `issue-type.service.ts`                 |
| Per-project name uniqueness, enforced twice | Two types with the same name in one project, even under a race                     | `issue-type.service.ts` + DB constraint |
| Archived types remain readable              | A type becoming permanently unrecoverable once archived                            | `issue-type.repository.ts`              |
| No delete endpoint, only archive/restore    | A type id referenced elsewhere becoming a dangling reference                       | `issue-type.repository.ts`              |
| Operational logging on every operation      | "What happened to this type?" being unanswerable after the fact                    | `issue-type.service.ts`                 |

## Authentication is required everywhere

`issueTypeRouter.use(authenticate)` runs before every route in this module, the same default every
other module in this codebase uses — there is no public read path for type data.

## Membership for reads, ownership for writes

This mirrors [Issue Priority's](../issue-priority/security.md#membership-for-reads-ownership-for-writes)
departure from Issues, where any project member has equal authority. Here, `findById` and
`findAll` accept any project member (owner or otherwise, via `validateMembership`), but `create`,
`update`, `archive`, and `restore` all require the requester to be the project **owner**
(`validateOwner`).

The reasoning: a type list defines a shared vocabulary every member of the project has to work
within. Letting any member add, rename, or archive types would mean one member could silently
change what "Bug" means for everyone else mid-project. Reading the list carries no such risk, so it
stays as open as the equivalent Issue Priority check. This is still a placeholder ahead of a real
Permissions module — see [`roadmap.md`](roadmap.md) for how owner-only would become role-based
without changing the public API.

## Per-project name uniqueness is enforced twice

`ensureUniqueName` in the service checks `findByName(projectId, name)` before every create and
rename, but the database also carries a `unique(project_id, name)` constraint on
`tbl_issue_type` (see `db/schema/issue_type.schema.ts`). The service-level check exists to return a
clean `409 TYPE_ALREADY_EXISTS` through the normal error path; the database constraint exists as a
backstop against a race between two concurrent requests slipping past that check at the same
instant. To close that race as tightly as possible, both the check and the write happen inside a
transaction holding a per-project Postgres advisory lock (`runLocked` / `lockProject`) — see
[`architecture.md`](architecture.md#locking).

## Archived types remain readable

`findById` and `findMany` in `issue-type.repository.ts` never filter on `archived`. This is the
opposite instinct from typical soft-delete filtering, and deliberately so: if archived rows were
hidden from reads, `restore()` would have no way to locate the type it's meant to bring back, and
an issue that still references an archived type id would have no way to display its name. Only the
_write_ paths (`create`, `update`, `archive`) care about `archived`, and only `restore` cares
whether it's currently `true`.

## No delete endpoint, only archive and restore

This module has no delete path and `tbl_issue_type` has no `deleted_at` column at all. A type id is
meant to be permanent once issued, because other rows (an issue's `type_id` once that link exists,
and any future hierarchy or scheme referencing a type by id — see [`roadmap.md`](roadmap.md)) may
depend on it always resolving to something. Archiving is the only retirement path, and it never
removes the row.

## Operational logging

Every meaningful operation in `issue-type.service.ts` — create, update, archive, restore, and
every rejected attempt (not found, not owner, not a member, name conflict, restore-not-archived) —
is written as a structured log line through the shared Pino `logger`, with `projectId`, `typeId`
(where applicable), and `userId`. Reads (`findById`, `findAll`) log at `debug` on success, matching
[Issue Priority's logging levels](../issue-priority/security.md#operational-logging).

This is for day-to-day traceability, not a security-incident audit trail. If type changes later
become a compliance question, that should adopt `AuditLogger` (`src/lib/audit/`) rather than
growing a parallel mechanism here.

**What's never logged:** type `name`, `description`, or `icon` content, or full request bodies —
only identifiers and the outcome.

## See also

- [`overview.md`](overview.md) — plain-language explanation of what's being protected and why
- [`architecture.md`](architecture.md) — how these controls fit into the request flow, including the logging levels used
- [`roadmap.md`](roadmap.md) — security-relevant work intentionally deferred (role-based type permissions)
- [`src/modules/issue-type/README.md`](../../src/modules/issue-type/README.md) — implementation reference
