# Projects — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Two reasons. First, so a reader doesn't mistake a missing feature for an oversight — every item
here was left out of this module's first version on purpose, to keep it focused on core lifecycle
management. Second, so whoever picks one of these up next doesn't have to reverse-engineer whether
the current design supports it — that answer is written down below.

## Planned features

| Feature               | What it adds                                                            | Current design's extension point                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project members       | Multiple people attached to a project, not just an owner                | New module + join table (`tbl_project_member`); `project.service.ts#loadAccessibleProject` is the single place a "is this user a member?" check gets added |
| Roles & permissions   | Differentiated capabilities (viewer/editor/admin) instead of owner-only | Builds on project members; `validateOwner` becomes `validatePermission(action)` without changing call sites in `update`/`archive`/`remove`                 |
| Ownership transfer    | Reassign `owner_id` to another user                                     | A new service method that updates `owner_id` via the existing repository `update()` — no schema change needed                                              |
| Favorites             | Users bookmark projects they care about                                 | New join table (`tbl_user_favorite_project`); read-only, doesn't touch project lifecycle logic                                                             |
| Project templates     | Create a project pre-populated from a template                          | A new `create`-adjacent service method that seeds additional data after the existing `create()` call                                                       |
| Project avatars       | An image associated with a project                                      | New nullable column + file storage integration; doesn't affect lifecycle or authorization logic                                                            |
| Project settings      | Per-project configuration (e.g. default issue type)                     | New related table keyed by `project_id`, read alongside the project rather than inline on `tbl_project`                                                    |
| Project statistics    | Issue counts, activity metrics, burndown-style data                     | Depends on the Issue module existing first; a read-only aggregation layer, not a change to this module                                                     |
| Project activity feed | A timeline of what happened to a project                                | The existing operational log lines (`project.service.ts`) are a candidate log source once a persistence layer for activity exists                          |
| Soft deletion         | Recoverable delete instead of permanent removal                         | Add a `deleted_at` column; `deleteById` becomes an update, and repository reads filter it out — no controller/route change                                 |
| Organization support  | Projects scoped under an organization, not just a single owner          | A new `organization_id` column + org module; visibility rules extend rather than change                                                                    |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require the Auth module to change, and none should
  require future modules (Issues, Boards) to reach into Projects' internals. They depend on the
  public `ProjectResponse` shape and the REST endpoints; as long as those contracts hold, everything
  above is internal to this module.
- **Response envelope and error format.** New flows should throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers, not a parallel format.
- **Key generation and immutability.** Ownership transfer, membership, and organizations all change
  _who can act on_ a project, never its `key`. The Issue module's future `PROJ-123`-style ids
  depend on that staying true.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why the Projects module exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and layering these features would build on
- [`security.md`](security.md) — security controls already in place, including gaps referenced above (e.g. owner-only authorization until roles exist)
- [`src/modules/projects/README.md`](../../src/modules/projects/README.md) — current implementation, including its own extension-points section
