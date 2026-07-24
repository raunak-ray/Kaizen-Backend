# Issues — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Same reasons as [Projects' roadmap](../projects/roadmap.md): so a reader doesn't mistake a missing
feature for an oversight, and so whoever builds one of these next doesn't have to reverse-engineer
whether the current design supports it.

## Planned features

| Feature                      | What it adds                                                        | Current design's extension point                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comments                     | Discussion threads on an issue                                      | New module, own table keyed by `issue_id`; reacts to issue existence, never writes to `tbl_issue`                                                                    |
| Labels                       | Free-form or predefined tags on issues                              | New join table (`tbl_issue_label`); read-only from this module's perspective                                                                                         |
| Attachments                  | Files attached to an issue                                          | New module + object storage integration, keyed by `issue_id`                                                                                                         |
| Watchers                     | Users who get notified of changes without being assignee/reporter   | New join table (`tbl_issue_watcher`); populated from domain events, not inline in `issue.service.ts`                                                                 |
| Mentions                     | `@user` references inside descriptions/comments                     | Parsed by whichever module owns the text (description here, comments later); emits an event, doesn't touch this module's schema                                      |
| Activity logging             | A durable, user-facing timeline per issue                           | The existing operational log lines in `issue.service.ts` are a candidate source once a persistence layer exists                                                      |
| Notifications                | Email/push/in-app alerts on issue events                            | Subscribes to the same domain events watchers would use                                                                                                              |
| Linked issues                | "blocks" / "duplicates" / "relates to" relationships                | New self-referential join table (`tbl_issue_link`); doesn't change `tbl_issue`                                                                                       |
| Bulk operations              | Update/assign/archive many issues in one request                    | A new service method that loops the existing single-issue operations, preserving per-issue validation                                                                |
| Time tracking                | Estimates and logged time per issue                                 | New table keyed by `issue_id`; read alongside the issue rather than inline on `tbl_issue`                                                                            |
| Custom fields                | Per-project, per-issue-type extra fields                            | New EAV-style or JSONB column, additive only — never a required field on the base schema                                                                             |
| Role-based issue permissions | Differentiated capabilities (e.g. only reporter/assignee can close) | `validateMembership` becomes `validatePermission(action)` without changing call sites in any public service method                                                   |
| Human-readable issue ids     | `PROJ-123` style ids instead of raw UUIDs                           | Builds directly on the project's immutable `key` (see [Projects' key generation](../projects/overview.md#what-is-a-projects-key)); a new sequence column per project |
| Sprint / epic association    | Grouping issues into sprints or epics                               | New `sprint_id`/`epic_id` nullable foreign key, additive to the existing schema                                                                                      |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require Auth, Projects, or Project Members to
  change, and none should require reaching into this module's repository directly. They depend on
  the public `IssueResponse` shape and REST endpoints, plus domain events where noted.
- **Response envelope and error format.** New flows throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers.
- **Soft delete semantics.** Every feature above must keep respecting `deleted_at` — a deleted
  issue should never resurface through a labels/comments/attachments join, even if that join table
  itself has no independent deletion concept.
- **Archived-issue protection.** Any new mutation path (e.g. bulk operations) must still run
  through `ensureIssueIsActive` rather than bypassing it for convenience.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why the Issues module exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and layering these features would build on
- [`security.md`](security.md) — security controls already in place, including the authorization gap referenced above (membership-only, not role-based, until a Permissions module exists)
- [`src/modules/issues/README.md`](../../src/modules/issues/README.md) — current implementation, including its own extension-points section
