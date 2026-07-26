# Issue Priority — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Same reasons as [Issue Status' roadmap](../issue-status/roadmap.md): so a reader doesn't mistake a
missing feature for an oversight, and so whoever builds one of these next doesn't have to
reverse-engineer whether the current design supports it.

## Planned features

| Feature                              | What it adds                                                                  | Current design's extension point                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default priority seeding             | New projects automatically get `Highest`/`High`/`Medium`/`Low`/`Lowest`       | `DEFAULT_PRIORITIES` already exists as a constant in `issue-priority.constants.ts`; wiring is a hook on project creation, not a schema change                           |
| Issues referencing a priority id     | Replace `tbl_issue.priority`'s hardcoded enum with a foreign key here         | `IssuePriorityResponse.id` is a stable uuid today; the Issues module would add a nullable `priority_id` column                                                          |
| SLA policies                         | Response/resolution time targets tied to a priority                           | New module/table keyed by `priority_id`; reads this module's priorities, doesn't modify them                                                                            |
| Escalation rules                     | Automatic reassignment or notification when an SLA is breached                | Builds on SLA policies above; doesn't change this module                                                                                                                |
| Custom icons                         | A visual glyph per priority, alongside the existing `color`                   | Same shape as `color` today — an additional nullable column plus a Zod validator                                                                                        |
| Organization-wide priority templates | Different projects reuse a named, shared priority set instead of one-off rows | New module that generates/copies a set of `tbl_issue_priority` rows from a template; this module stays the source of truth for the rows themselves                      |
| Reorder endpoint                     | Move a priority to a new level without hand-computing every other row's level | `level` is a plain integer today; a dedicated `PATCH /reorder` could take a list of ids and renumber them atomically                                                    |
| Role-based priority permissions      | Differentiated capabilities beyond "owner vs. everyone else"                  | `validateOwner` becomes `validatePermission(action)` without changing call sites in any public service method, same as [Issue Status' plan](../issue-status/roadmap.md) |
| Workflow/automation integration      | Priority changes triggering issue workflow transitions                        | Builds on both this module and a future [Issue Status](../issue-status/roadmap.md) workflow-transitions feature; neither module changes to support it                   |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require Auth, Projects, or Project Members to
  change, and none should require reaching into this module's repository directly. They depend on
  the public `IssuePriorityResponse` shape and REST endpoints.
- **Response envelope and error format.** New flows throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers.
- **No physical delete.** Every feature above must keep treating a priority id as permanent once
  issued — archiving is the only retirement path, since anything that references a priority by id
  (issues, SLA policies, templates) must always be able to resolve it.
- **Owner-only writes, membership-only reads.** Any new mutation path (e.g. a reorder endpoint)
  must still run through `validateOwner` rather than bypassing it for convenience, until a real
  Permissions module changes the authorization model itself.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why the Issue Priority module exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and layering these features would build on
- [`security.md`](security.md) — security controls already in place, including the authorization gap referenced above (owner-only writes, not role-based, until a Permissions module exists)
- [`src/modules/issue-priority/README.md`](../../src/modules/issue-priority/README.md) — current implementation, including its own extension-points section
