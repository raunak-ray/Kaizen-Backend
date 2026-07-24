# Issues — Security

**Audience:** developers, technical leads, and anyone evaluating the security posture of this
system. Assumes you've read [`overview.md`](overview.md); this document goes deeper on _why_ each
control exists, not just that it does.

## At a glance

| Control                                                 | Protects against                                                           | Where                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------- |
| `authenticate` required on every route                  | Anonymous access to any issue data                                         | `issue.routes.ts`     |
| Membership required for every operation                 | A stranger with a valid account acting on a project they don't belong to   | `issue.service.ts`    |
| Assignee must exist **and** be a project member         | Assigning work to an unknown user, or a user with no access to the project | `issue.service.ts`    |
| Archived issues reject mutation                         | Silent edits to an issue a team considers "closed"                         | `issue.service.ts`    |
| Soft delete, never a physical `DELETE`                  | Permanent, unrecoverable data loss from a single mistaken request          | `issue.repository.ts` |
| Reporter derived from the token, never the request body | A client setting `reporterId` to someone else's account                    | `issue.controller.ts` |
| Operational logging on every operation                  | "What happened to this issue?" being unanswerable after the fact           | `issue.service.ts`    |

## Authentication is required everywhere

`issueRouter.use(authenticate)` runs before every route in this module, the same default Projects
and Project Members use — there is no public read path for issue data.

## Membership, not ownership, is the authorization boundary

This is a deliberate departure from [Projects](../projects/security.md#owner-only-mutation), where
only the project **owner** may mutate anything. For issues, **any** project member — owner or
otherwise — may create, view, update, assign, archive, restore, or delete any issue in that
project. `validateMembership` treats "is the owner" and "has a `tbl_project_member` row" as
equally sufficient.

This is intentionally coarse. Real issue trackers eventually need finer distinctions (e.g. only a
reporter or assignee can close their own issue, or only admins can delete), but building that
before a real Permissions module exists would mean guessing at a policy shape today and likely
redoing it later. Every project member having equal issue authority is the simplest correct
starting point — see [`roadmap.md`](roadmap.md) for how role-based issue permissions would extend
this without changing the API.

## Assignment has two distinct failure modes

Assigning an issue checks two independent things, in order:

1. **Does this user exist at all?** (`authRepository.findById`) — if not, `404 ASSIGNEE_NOT_FOUND`.
2. **Does this user belong to the issue's project?** (owner or `projectMemberRepository.exists`) —
   if not, `400 ASSIGNEE_NOT_A_MEMBER`.

Both checks matter independently. Skipping the first would let a client assign issues to a
plausible-looking but nonexistent id. Skipping the second would let anyone assign an issue to a
real user who has no way to see or act on it — a dead end that would look like a bug from the
assignee's side, not a security hole from the requester's. Keeping them as distinct error codes
(rather than collapsing both into a generic 400) makes both failure modes debuggable from a client
integration without guessing.

## Archived issues reject mutation

`ensureIssueIsActive` runs after the membership and existence checks on every update, assign,
status-change, and priority-change call, and rejects with `409 ISSUE_ARCHIVED` if the issue is
archived. Archiving is deliberately **not** itself blocked by this check (so an already-archived
issue can be archived again without error), and deletion isn't blocked by it either — see
[Common Pitfalls in the module README](../../src/modules/issues/README.md) for the full list of
which operations are and aren't gated by this rule.

## Soft delete is a data-lifecycle control, not an access control

Deleting an issue only sets `deleted_at`; every repository read filters `WHERE deleted_at IS NULL`
so a deleted issue is indistinguishable from one that never existed (`404 ISSUE_NOT_FOUND`) through
the API. Unlike [Projects' private-project 404](../projects/security.md#private-projects-return-404-not-403),
this isn't about preventing enumeration of something sensitive — it's simply that "deleted" means
"gone" from every consumer's perspective, while keeping the row recoverable at the database layer
for a future admin/undo path.

## Reporter derived from the token

`req.user.id` is the only source for `reporterId` at creation time. `createIssueSchema` has no
`reporterId` field, so there's no request field a client could set to attribute an issue to another
user.

## Operational logging

Every meaningful operation in `issue.service.ts` — create, update, assign, status/priority change,
archive, restore, delete, and every rejected attempt (not found, not a member, archived-conflict,
invalid assignee) — is written as a structured log line through the shared Pino `logger`, with
`projectId`, `issueId` (where applicable), and `userId` so "what happened to this issue, and when"
is answerable from logs.

This follows the same reasoning as [Projects' operational logging](../projects/security.md#operational-logging):
it's for day-to-day traceability, not a security-incident audit trail. If issue-level actions later
become a compliance question (e.g. once real permissions exist and "who deleted this issue" needs a
durable, tamper-evident record), that should adopt `AuditLogger` (`src/lib/audit/`) rather than
growing a parallel mechanism here.

**What's never logged:** issue `title`, `description` content, or full request bodies — only
identifiers and the outcome.

## See also

- [`overview.md`](overview.md) — plain-language explanation of what's being protected and why
- [`architecture.md`](architecture.md) — how these controls fit into the request flow, including the logging levels used
- [`roadmap.md`](roadmap.md) — security-relevant work intentionally deferred (role-based issue permissions, activity/audit trail)
- [`src/modules/issues/README.md`](../../src/modules/issues/README.md) — implementation reference
