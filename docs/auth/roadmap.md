# Authentication — Roadmap

**Audience:** anyone planning or scoping future work in this area. Nothing on this page is
implemented yet — it documents deliberate scope boundaries and the extension points already in
place so future work doesn't require re-architecting this module.

## Why document unimplemented features?

Two reasons. First, so a reader doesn't mistake a missing feature for an oversight — every item
here was left out of the hardening pass on purpose, to keep that change focused. Second, so
whoever picks one of these up next doesn't have to reverse-engineer whether the current design
supports it — that answer is written down below.

## Planned features

| Feature                     | What it adds                                                                    | Current design's extension point                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Email verification          | Confirm a registered email is real before granting full access                  | New `email_verified_at` column + a short-lived, single-purpose token — the JWT versioning/type pattern already used for access/refresh tokens extends directly to a `type: "email_verification"` token |
| Password reset              | Let a user regain access without knowing their old password                     | Same single-purpose token pattern as above; `jwt_version` already gives a natural way to invalidate all other sessions on reset                                                                        |
| Email notifications         | Notify users of security events (new login, password changed)                   | Audit events already fire at every relevant point (`LOGIN_SUCCEEDED`, etc.) — a notification consumer subscribes to the same events, no `auth.service.ts` changes needed                               |
| Background workers / BullMQ | Move slow or non-critical work (emails, audit persistence) off the request path | `AuditLogger` is already an interface; swapping `auditService`'s implementation for one that enqueues to BullMQ is the entire integration point                                                        |
| MFA (multi-factor auth)     | A second verification step at login                                             | Slots in between "password verified" and "tokens issued" in the login flow — an intermediate token type would express "password verified, MFA pending"                                                 |
| OAuth (Google, GitHub, ...) | Let users sign in via a third-party identity provider                           | `authRepository` and `AuthenticatedUser` are provider-agnostic already (email/name only); OAuth becomes an alternate way to reach the same "issue tokens for this user" step, not a parallel system    |
| SSO                         | Enterprise identity federation (SAML/OIDC)                                      | Same integration point as OAuth — a new "how did we verify this identity" step feeding the same token issuance                                                                                         |
| Session management          | List/revoke individual sessions, detect refresh-token reuse                     | Requires moving beyond a single `jwt_version` counter to per-session records; the version-check _pattern_ stays, the storage shape changes                                                             |
| Device management           | Recognize/name/revoke specific devices                                          | Builds on session management — a device is metadata attached to a session record                                                                                                                       |

## What's deliberately _not_ changing to support these

- **Modular boundary.** None of the above should require other modules (Projects, Issues, ...) to
  change. They depend on `authenticate` and `AuthenticatedUser`; as long as those contracts hold,
  everything above is internal to this module.
- **Response envelope and error format.** New flows should throw `AppError` and return through the
  existing `successResponse`/`errorResponse` helpers, not a parallel format.
- **JWT-based identity.** Even MFA and OAuth ultimately end at "issue an access/refresh pair" —
  they change _how_ identity is established, not what a validated session looks like afterward.

## Explicitly out of scope for "when," not just "what"

This page describes _how_ the architecture accommodates each feature, not _when_ any of them will
be built. Treat each row as a candidate for its own scoped issue, not a backlog commitment.

## See also

- [`overview.md`](overview.md) — why authentication exists and what it currently does
- [`architecture.md`](architecture.md) — the request flow and infrastructure these features would build on
- [`security.md`](security.md) — security controls already in place, including gaps referenced above (e.g. refresh-token reuse detection)
- [`src/modules/auth/README.md`](../../src/modules/auth/README.md) — current implementation, including its own extension-points section
