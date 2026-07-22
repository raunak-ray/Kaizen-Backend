# Projects — Security

**Audience:** developers, technical leads, and anyone evaluating the security posture of this
system. Assumes you've read [`overview.md`](overview.md); this document goes deeper on _why_ each
control exists, not just that it does.

## At a glance

| Control                                              | Protects against                                                         | Where                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------- |
| `authenticate` required on every route               | Anonymous access to any project data                                     | `project.routes.ts`     |
| Owner-only mutation                                  | Any authenticated user editing/archiving/deleting someone else's project | `project.service.ts`    |
| Private projects return 404, not 403                 | Confirming a private project's existence to a non-owner                  | `project.service.ts`    |
| Immutable project key                                | Broken references once a future Issue module builds ids on top of it     | `project.schema.ts`     |
| Archived projects reject updates                     | Silent edits to a project a team considers "closed"                      | `project.service.ts`    |
| Owner derived from the token, never the request body | A client setting `ownerId` to someone else's account                     | `project.controller.ts` |
| Operational logging on every operation               | "What happened to this project?" being unanswerable after the fact       | `project.service.ts`    |

## Authentication is required everywhere

`projectRouter.use(authenticate)` runs before every route in this module — there is no public
endpoint, unlike Auth's `/register` and `/login`. This is a deliberate default: a project-tracking
product has no meaningful "logged out" view of project data, so requiring a valid access token for
every single route is simpler and safer than trying to enumerate which routes should be public.

## Owner-only mutation

Update, archive, and delete all call `validateOwner`, which compares the authenticated user's id
against the project's `owner_id` and rejects with `403 FORBIDDEN` on any mismatch. There is
currently no way for a second user to gain edit rights on someone else's project — that's
intentional; see [Future roadmap](roadmap.md) for how membership will extend this, not replace it.

## Private projects return 404, not 403

When a non-owner requests a private project — by id, directly — the response is
`404 PROJECT_NOT_FOUND`, identical to what they'd get for an id that doesn't exist at all. If this
instead returned `403 FORBIDDEN`, an attacker (or just an overly curious user) could enumerate
random UUIDs and learn which ones correspond to real private projects, even without ever seeing
their contents. Returning the same generic "not found" response for both cases closes that
enumeration channel — the same principle Auth applies to
[generic login errors](../auth/security.md#generic-authentication-errors).

The two cases are still distinguished **internally**, in the logs (`"Project not found"` vs.
`"Blocked access to a private project"`), so this doesn't cost any debuggability — it only hides
the distinction from the client.

## Owner derived from the token

`req.user.id` — populated by `authenticate` after verifying the caller's access token — is the
only source for a project's `owner_id` at creation time. The create schema
(`createProjectSchema`) has no `ownerId` field at all, so there's no request field a client could
even attempt to set to claim ownership of a project on someone else's behalf.

## Immutable project key

There is no `key` field in `updateProjectSchema` — once generated at creation, a project's key
never changes. This matters beyond internal consistency: the roadmap for this module includes an
Issue module that will build human-readable ticket ids (`PROJ-123`) directly on top of the project
key. If keys could change, every issue id referencing the old key would silently break. Immutability
here is a forward-looking guarantee, not just a current-state simplification.

## Archived projects reject updates

`ensureNotArchived` runs after the ownership check on every `update` call and rejects with
`409 PROJECT_ARCHIVED` if the project is archived. This exists so "archive" means something: without
it, archiving would be purely cosmetic — a project marked "closed" that could still be silently
edited. Archiving does **not** block reads or deletion; see
[Common Pitfalls in the module README](../../src/modules/projects/README.md#common-pitfalls) for
why that split is intentional.

## Operational logging

Every meaningful operation in `project.service.ts` — create, update, archive, delete, and every
rejected attempt (not found, forbidden, archived-conflict) — is written as a structured log line
through the shared Pino `logger`, with enough context (`projectId`, `userId`/`ownerId`, operation
name) to answer "what happened to this project, and when" by reading logs instead of guessing.

This is deliberately **not** the same mechanism as Auth's `AuditLogger` (`src/lib/audit/`). Auth's
audit trail exists for security-incident reconstruction (account takeover investigation) and is
built as a swappable interface for that reason. Projects' logging exists for day-to-day operational
visibility — a developer or on-call engineer asking "why did this project get archived?" — and
uses the shared logger directly rather than a dedicated abstraction, because that's the smaller,
sufficient tool for this job. If Projects later needs a real audit trail (e.g. once membership and
permissions exist and "who changed this project's visibility" becomes a security question, not just
an operational one), it should adopt `AuditLogger` at that point rather than growing a parallel one.

**What's never logged:** project `description` content and full request bodies — only identifiers
(`projectId`, `key`, `userId`, `ownerId`) and the outcome. Log lines are for tracing what happened,
not for storing project content a second time.

## See also

- [`overview.md`](overview.md) — plain-language explanation of what's being protected and why
- [`architecture.md`](architecture.md) — how these controls fit into the request flow, including the logging levels used
- [`roadmap.md`](roadmap.md) — security-relevant work intentionally deferred (membership, permissions, soft delete)
- [`src/modules/projects/README.md`](../../src/modules/projects/README.md) — implementation reference
