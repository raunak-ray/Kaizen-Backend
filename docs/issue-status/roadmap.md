# Issue Status — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Same reasons as [Issues' roadmap](../issues/roadmap.md): so a reader doesn't mistake a missing
feature for an oversight, and so whoever builds one of these next doesn't have to reverse-engineer
whether the current design supports it.

## Planned features

| Feature                                | What it adds                                                                      | Current design's extension point                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default status seeding                 | New projects automatically get `Todo`/`In Progress`/`Review`/`Done`               | `DEFAULT_STATUSES` already exists as a constant in `issue-status.constants.ts`; wiring is a hook on project creation, not a schema change                   |
| Issues referencing a status id         | Replace `tbl_issue.status`'s hardcoded enum with a foreign key here               | `IssueStatusResponse.id` is a stable uuid today; the Issues module would add a nullable `status_id` column                                                  |
| Custom workflows                       | Per-project, ordered sequences of allowed statuses                                | This module already models a project-scoped, ordered (`position`) list of statuses — a workflow is that list plus transition rules                          |
| Workflow transitions                   | Rules for which status an issue can move to next                                  | New module/table keyed by `(from_status_id, to_status_id)`; reads this module's statuses, doesn't modify them                                               |
| Conditional transitions                | Transitions gated on custom logic (e.g. required fields filled)                   | Builds on workflow transitions above; doesn't change this module                                                                                            |
| Permission-based transitions           | Only certain roles/users can move an issue into or out of a status                | Builds on a future Permissions module the same way [Issues' roadmap](../issues/roadmap.md) describes for issue actions                                      |
| Workflow schemes                       | Different projects reuse a named, shared workflow instead of one-off statuses     | New module that generates/copies a set of `tbl_issue_status` rows from a template; this module stays the source of truth for the rows themselves            |
| Reorder endpoint                       | Move a status to a new position without hand-computing every other row's position | `position` is a plain integer today; a dedicated `PATCH /reorder` could take a list of ids and renumber them atomically                                     |
| Role-based status permissions          | Differentiated capabilities beyond "owner vs. everyone else"                      | `validateOwner` becomes `validatePermission(action)` without changing call sites in any public service method, same as [Issues' plan](../issues/roadmap.md) |
| Status categories driving a board view | Kanban-style columns grouped by `category`                                        | `category` (`todo`/`in-progress`/`done`) already exists on every status for exactly this purpose                                                            |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require Auth, Projects, or Project Members to
  change, and none should require reaching into this module's repository directly. They depend on
  the public `IssueStatusResponse` shape and REST endpoints.
- **Response envelope and error format.** New flows throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers.
- **No physical delete.** Every feature above must keep treating a status id as permanent once
  issued — archiving is the only retirement path, since anything that references a status by id
  (issues, workflow transitions, schemes) must always be able to resolve it.
- **Owner-only writes, membership-only reads.** Any new mutation path (e.g. a reorder endpoint)
  must still run through `validateOwner` rather than bypassing it for convenience, until a real
  Permissions module changes the authorization model itself.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why the Issue Status module exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and layering these features would build on
- [`security.md`](security.md) — security controls already in place, including the authorization gap referenced above (owner-only writes, not role-based, until a Permissions module exists)
- [`src/modules/issue-status/README.md`](../../src/modules/issue-status/README.md) — current implementation, including its own extension-points section
