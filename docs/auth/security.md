# Authentication — Security

**Audience:** developers, technical leads, and anyone evaluating the security posture of this
system. Assumes you've read [`overview.md`](overview.md); this document goes deeper on _why_ each
control exists, not just that it does.

## At a glance

| Control                       | Protects against                                          | Where                                       |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| bcrypt password hashing       | Password exposure if the database leaks                   | `auth.service.ts`                           |
| Password max length (72)      | Silent truncation giving a false sense of strength        | `auth.constants.ts`, `auth.schema.ts`       |
| JWT algorithm allow-list      | Algorithm-confusion attacks                               | `auth.service.ts`                           |
| JWT issuer + audience         | Token reuse across services/environments sharing a secret | `auth.service.ts`                           |
| Refresh token rotation        | A leaked refresh token being usable indefinitely          | `auth.service.ts`                           |
| JWT versioning                | Needing a session store to support "logout everywhere"    | `auth.repository.ts`, `auth.middleware.ts`  |
| Rate limiting                 | Brute force, credential stuffing, registration spam       | `src/lib/rate-limit/`, `auth.rate-limit.ts` |
| Audit logging                 | Security incidents being undetectable after the fact      | `src/lib/audit/`                            |
| Generic authentication errors | Account enumeration                                       | `auth.service.ts`, `auth.constants.ts`      |

## Password hashing

Passwords are hashed with **bcrypt** (10 salt rounds) before storage; the plaintext password is
never persisted and never appears in a response. Bcrypt is deliberately slow and includes a
per-password salt, which makes both rainbow-table attacks and mass-cracking a leaked database
computationally expensive.

**Password max length (72 bytes).** bcrypt silently ignores any input past 72 bytes — a 200-
character password would only ever be checked against its first 72 bytes, which is worse than
useless: it _looks_ like a strong password policy while providing none of the benefit past that
point. Rejecting overlong passwords at validation time makes the actual guarantee match the
apparent one.

## JWT algorithm restriction

`jwt.verify()` is called with an explicit `algorithms` allow-list containing only `HS256`. This
matters because JWT libraries historically trusted the algorithm named in the token's own header —
an attacker who could influence that header could, in the worst case, get a token accepted as
unsigned (`alg: none`) or signed with the wrong key type. Passing an explicit allow-list removes
that decision from the token entirely.

## JWT issuer and audience

Every token is signed with an `issuer` (`JWT_ISSUER`) and `audience` (`JWT_AUDIENCE`) claim, and
every verification checks both. This matters most once there's more than one JWT-issuing service
in the picture (a staging environment sharing infra with production, a future internal service
using the same secret rotation) — issuer/audience checks ensure a token minted for one context
can't be replayed against another, even if the signing secret is identical.

## Password validation

Beyond length, passwords must include a lowercase letter, an uppercase letter, and a digit
(`PASSWORD_REGEX`). This is a baseline complexity floor, not a substitute for the length and
hashing controls above — length and hash cost matter far more to actual crack-resistance than
character-class rules, which is why the regex stays simple rather than growing increasingly
elaborate rules that mostly frustrate users without meaningfully raising attacker cost.

## Refresh token rotation

Every call to `/auth/refresh` returns a **new** refresh token, not the same one extended. This
limits how long a leaked refresh token remains useful — under normal use, the original is
superseded the moment the legitimate client refreshes, generally within its short access-token
window.

> **Known gap:** rotation today doesn't yet detect _reuse_ of an already-rotated refresh token
> (which is the specific signal that a token was stolen and both the attacker and the legitimate
> user are now racing to refresh). See [`roadmap.md`](roadmap.md#planned-features) (session
> management row) — this is a deliberate scope boundary for this iteration, not an oversight.

## JWT versioning

Rather than maintaining a server-side session table or token blacklist, each user has a
`jwt_version` column. Every token carries a snapshot of that version at issue time, and every
verification compares it against the user's _current_ version. Logout — or a future "log out all
devices" action — is just `jwt_version += 1`: every previously issued token, anywhere, fails its
next verification.

This trades a small amount of always-on complexity (one extra column, one extra comparison per
request) for not needing a stateful session store at all, which keeps the service horizontally
scalable without a shared cache for session data.

## Rate limiting

Public authentication endpoints are the most attractive target for automated abuse — password
guessing, credential-stuffing against leaked password lists, and registration spam are all cheap
to run and expensive to clean up after. Different endpoints carry different risk, so they carry
different limits (registration and login are tighter than refresh, since refresh already requires
possessing a valid token).

Rate limiting is IP-based on public endpoints and user-based on authenticated ones — see
[`architecture.md`](architecture.md#rate-limiting-architecture) for why user-based limiting
requires running _after_ authentication, and for the reusable design other modules build on.

## Audit logging

Rate limiting slows an attack down; audit logging is what lets someone reconstruct what happened
_after_ one succeeds (or almost did). Every login attempt, successful or not, every registration,
refresh, and logout is recorded with enough context (which account, from which network address,
when) to answer "was this account compromised, and when." Passwords, tokens, and full request
bodies are never included — the goal is a trail, not a liability.

## Generic authentication errors

Login failures always return the same `INVALID_CREDENTIALS` error whether the email doesn't exist
or the password is wrong. If these were distinguished, an attacker could enumerate which emails
have registered accounts simply by trying them — turning "guess a password" into a two-stage
attack that starts with a much smaller, validated target list. The one-size-fits-all message costs
nothing in legitimate usability (a real user with the wrong password doesn't need to know _which_
part was wrong) and closes that entire class of enumeration.

Note: `ACCOUNT_INACTIVE` is intentionally distinct from `INVALID_CREDENTIALS` — the product
requirement is that a deactivated user gets a clear message, at the cost of confirming the account
exists. This is a deliberate, scoped exception to the rule above, not an inconsistency.

## Correct client IP resolution

Rate limiting and audit logs are only as trustworthy as `req.ip`. Behind a reverse proxy or load
balancer, Express must be told how many hops to trust (`TRUST_PROXY`) before it will read the real
client IP from `X-Forwarded-For` — left at its default in that kind of deployment, every request
appears to originate from the proxy, silently defeating IP-based rate limiting and polluting audit
logs with the wrong address.

## See also

- [`overview.md`](overview.md) — plain-language explanation of what's being protected and why
- [`architecture.md`](architecture.md) — how these controls fit into the request flow
- [`roadmap.md`](roadmap.md) — security-relevant work intentionally deferred (MFA, reuse detection, session management)
- [`src/modules/auth/README.md`](../../src/modules/auth/README.md) — implementation reference
