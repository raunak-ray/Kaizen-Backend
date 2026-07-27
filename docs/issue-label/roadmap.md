# Issue Label — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Same reasons as [Issue Type's roadmap](../issue-type/roadmap.md): so a reader doesn't mistake a
missing feature for an oversight, and so whoever builds one of these next doesn't have to
reverse-engineer whether the current design supports it.

## Planned features

| Feature                      | What it adds                                                                                                          | Current design's extension point                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label assignment to issues   | Attach one or more labels to an issue                                                                                 | A new join table (e.g. `tbl_issue_label_link`) keyed by `label_id`; reads this module's labels, doesn't modify them                                                  |
| Organization-wide labels     | Labels shared across every project in an organization, not just one project                                           | New module or nullable `organization_id` scope; this module stays the source of truth for per-project rows                                                           |
| Label groups                 | Group related labels (e.g. all "Team: X" labels) for filtering/UI                                                     | New table keyed by `label_id`; doesn't change this module's shape                                                                                                    |
| Automatic labeling           | Rules that apply a label when an issue matches a condition                                                            | New module that calls this module's `findMany`/`create` rather than reaching into its repository                                                                     |
| AI-generated labels          | Suggest or auto-apply labels based on issue content                                                                   | Same extension point as automatic labeling, layered with a suggestion/approval step                                                                                  |
| Label templates              | Reusable label sets applied when a project is created                                                                 | New module that seeds `tbl_issue_label` rows via this module's `create`, similar to how default type seeding is planned for Issue Type                               |
| Label usage analytics        | Counts and trends of label usage across issues                                                                        | Reads from the future assignment join table plus this module's rows; no change needed here                                                                           |
| Role-based label permissions | Differentiated capabilities beyond "owner vs. everyone else"                                                          | `validateOwner` becomes `validatePermission(action)` without changing call sites in any public service method, same as [Issue Type's plan](../issue-type/roadmap.md) |
| Race-safe uniqueness check   | Close the concurrent-create race noted in [`architecture.md`](architecture.md#no-locking-a-deliberate-simplification) | Wrap `ensureUniqueName` + write in a transaction with a per-project advisory lock and translate unique-violation errors, matching Issue Type's `runLocked`           |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require Auth, Projects, or Project Members to
  change, and none should require reaching into this module's repository directly. They depend on
  the public `IssueLabelResponse` shape and REST endpoints.
- **Response envelope and error format.** New flows throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers.
- **No physical delete.** Every feature above must keep treating a label id as permanent once
  issued — archiving is the only retirement path, since anything that references a label by id
  (issue assignments, groups, templates) must always be able to resolve it.
- **Owner-only writes, membership-only reads.** Any new mutation path must still run through
  `validateOwner` rather than bypassing it for convenience, until a real Permissions module changes
  the authorization model itself.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why the Issue Label module exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and layering these features would build on
- [`security.md`](security.md) — security controls already in place, including the race-condition gap referenced above
- [`src/modules/issue-label/README.md`](../../src/modules/issue-label/README.md) — current implementation, including its own extension-points section
