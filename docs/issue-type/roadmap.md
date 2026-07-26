# Issue Type — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Same reasons as [Issue Priority's roadmap](../issue-priority/roadmap.md): so a reader doesn't
mistake a missing feature for an oversight, and so whoever builds one of these next doesn't have
to reverse-engineer whether the current design supports it.

## Planned features

| Feature                      | What it adds                                                                     | Current design's extension point                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default type seeding         | New projects automatically get `Task`/`Bug`/`Story`/`Epic`/`Spike`/`Improvement` | `DEFAULT_TYPES` already exists as a constant in `issue-type.constants.ts`; wiring is a hook on project creation, not a schema change                                         |
| Issues referencing a type id | Replace `tbl_issue.type`'s hardcoded enum with a foreign key here                | `IssueTypeResponse.id` is a stable uuid today; the Issues module would add a nullable `type_id` column                                                                       |
| Issue type hierarchies       | Sub-tasks under a parent type (e.g. Epic → Story → Sub-task)                     | New self-referencing column or join table keyed by `type_id`; reads this module's types, doesn't modify them                                                                 |
| Issue type schemes           | Different projects reuse a named, shared set of types instead of one-off rows    | New module that generates/copies a set of `tbl_issue_type` rows from a template; this module stays the source of truth for the rows themselves                               |
| Screen schemes               | Different fields shown per type when creating/editing an issue                   | New module keyed by `type_id`; doesn't change this module's shape                                                                                                            |
| Organization-wide templates  | Shared type sets reused across projects                                          | Same extension point as issue type schemes above, scoped one level higher                                                                                                    |
| Custom metadata              | Arbitrary key/value fields per type                                              | New nullable JSON column, or a related table keyed by `type_id`                                                                                                              |
| Role-based type permissions  | Differentiated capabilities beyond "owner vs. everyone else"                     | `validateOwner` becomes `validatePermission(action)` without changing call sites in any public service method, same as [Issue Priority's plan](../issue-priority/roadmap.md) |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require Auth, Projects, or Project Members to
  change, and none should require reaching into this module's repository directly. They depend on
  the public `IssueTypeResponse` shape and REST endpoints.
- **Response envelope and error format.** New flows throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers.
- **No physical delete.** Every feature above must keep treating a type id as permanent once
  issued — archiving is the only retirement path, since anything that references a type by id
  (issues, hierarchies, schemes) must always be able to resolve it.
- **Owner-only writes, membership-only reads.** Any new mutation path must still run through
  `validateOwner` rather than bypassing it for convenience, until a real Permissions module changes
  the authorization model itself.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why the Issue Type module exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and layering these features would build on
- [`security.md`](security.md) — security controls already in place, including the authorization gap referenced above (owner-only writes, not role-based, until a Permissions module exists)
- [`src/modules/issue-type/README.md`](../../src/modules/issue-type/README.md) — current implementation, including its own extension-points section
