# Issue Label — Security

**Audience:** developers, technical leads, and anyone evaluating the security posture of this
system. Assumes you've read [`overview.md`](overview.md); this document goes deeper on _why_ each
control exists, not just that it does.

## At a glance

| Control                                      | Protects against                                                                    | Where                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `authenticate` required on every route       | Anonymous access to any label data                                                  | `issue-label.routes.ts`                  |
| Owner-only authorization on writes           | Any member reshaping a project's label list, not just the person accountable for it | `issue-label.service.ts`                 |
| Membership required on reads                 | A stranger with a valid account reading a project's labels                          | `issue-label.service.ts`                 |
| Per-project name uniqueness, service-checked | Two labels with the same name in one project under normal, non-concurrent use       | `issue-label.service.ts` + DB constraint |
| Archived labels remain readable              | A label becoming permanently unrecoverable once archived                            | `issue-label.repository.ts`              |
| No delete endpoint, only archive/restore     | A label id referenced elsewhere becoming a dangling reference                       | `issue-label.repository.ts`              |
| Operational logging on every operation       | "What happened to this label?" being unanswerable after the fact                    | `issue-label.service.ts`                 |

## Authentication is required everywhere

`issueLabelRouter.use(authenticate)` runs before every route in this module, the same default
every other module in this codebase uses — there is no public read path for label data.

## Membership for reads, ownership for writes

This mirrors [Issue Type's](../issue-type/security.md#membership-for-reads-ownership-for-writes)
departure from Issues, where any project member has equal authority. Here, `findById` and
`findAll` accept any project member (owner or otherwise, via `validateMembership`), but `create`,
`update`, `archive`, and `restore` all require the requester to be the project **owner**
(`validateOwner`).

The reasoning: a label list defines a shared vocabulary every member of the project has to work
within. Letting any member add, rename, or archive labels would mean one member could silently
change what "Blocked" means for everyone else mid-project. Reading the list carries no such risk,
so it stays as open as the equivalent Issue Type check. This is still a placeholder ahead of a real
Permissions module — see [`roadmap.md`](roadmap.md) for how owner-only would become role-based
without changing the public API.

## Per-project name uniqueness is checked once, not twice

`ensureUniqueName` in the service checks `findByName(projectId, name)` before every create and
rename, and the database also carries a `unique(project_id, name)` constraint on
`tbl_issue_label` (see `db/schema/issue_label.schema.ts`). Unlike [Issue
Type](../issue-type/security.md#per-project-name-uniqueness-is-enforced-twice), the check and the
write here are **not** wrapped in a transaction with an advisory lock, and the service does not
catch a unique-violation error from the database. In practice this means:

- Under normal (non-concurrent) use, the service-level check alone is sufficient and returns a
  clean `409 LABEL_ALREADY_EXISTS`.
- Under a genuine race — two requests creating or renaming to the same name in the same project at
  the same instant — both could pass the pre-check, and the losing write would fail the DB
  constraint and bubble up as an unhandled `500 INTERNAL_SERVER_ERROR` rather than a `409`.

This is a deliberate simplification for this module's first version, not a silent gap — see
[`roadmap.md`](roadmap.md#planned-features) for closing it the same way Issue Type,
Issue Priority, and Issue Status already do.

## Archived labels remain readable

`findById` and `findMany` in `issue-label.repository.ts` never filter on `archived`. This is the
opposite instinct from typical soft-delete filtering, and deliberately so: if archived rows were
hidden from reads, `restore()` would have no way to locate the label it's meant to bring back, and
an issue that later references an archived label id would have no way to display its name. Only
the _write_ paths (`create`, `update`, `archive`) care about `archived`, and only `restore` cares
whether it's currently `true`.

## No delete endpoint, only archive and restore

This module has no delete path and `tbl_issue_label` has no `deleted_at` column at all. A label id
is meant to be permanent once issued, because other rows (a future issue-label assignment, group,
or template referencing a label by id — see [`roadmap.md`](roadmap.md)) may depend on it always
resolving to something. Archiving is the only retirement path, and it never removes the row.

## Operational logging

Every meaningful operation in `issue-label.service.ts` — create, update, archive, restore, and
every rejected attempt (not found, not owner, not a member, name conflict, restore-not-archived) —
is written as a structured log line through the shared Pino `logger`, with `projectId`, `labelId`
(where applicable), and `userId`. Reads (`findById`, `findAll`) log at `debug` on success, matching
[Issue Type's logging levels](../issue-type/security.md#operational-logging).

This is for day-to-day traceability, not a security-incident audit trail. If label changes later
become a compliance question, that should adopt `AuditLogger` (`src/lib/audit/`) rather than
growing a parallel mechanism here.

**What's never logged:** label `name`, `color`, or `description` content, or full request
bodies — only identifiers and the outcome.

## See also

- [`overview.md`](overview.md) — plain-language explanation of what's being protected and why
- [`architecture.md`](architecture.md) — how these controls fit into the request flow, including the locking gap noted above
- [`roadmap.md`](roadmap.md) — security-relevant work intentionally deferred (race-safe uniqueness, role-based label permissions)
- [`src/modules/issue-label/README.md`](../../src/modules/issue-label/README.md) — implementation reference
