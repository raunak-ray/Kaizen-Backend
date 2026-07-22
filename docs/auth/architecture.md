# Authentication — Architecture

**Audience:** developers and contributors who want to understand how the system fits together
before reading code. Read [`overview.md`](overview.md) first if you haven't — this document
assumes you already know _why_ the system works this way and focuses on _how_.

## Layered design

The module follows the same layering as the rest of the backend:

```mermaid
flowchart TD
    Route[Route] --> MW["Middleware<br/>rate limiter / authenticate"]
    MW --> Val["Validation<br/>Zod schema"]
    Val --> Ctrl["Controller<br/>thin, no business logic"]
    Ctrl --> Svc["Service<br/>all business rules live here"]
    Svc --> Repo["Repository<br/>database queries only"]
    Repo --> DB[(PostgreSQL)]
```

Each layer has exactly one job:

| Layer      | Job                                                                           | Must NOT do                           |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| Route      | Wire middleware + schema + controller together                                | Contain logic                         |
| Middleware | Rate-limit or authenticate the request                                        | Touch business rules                  |
| Validation | Reject malformed input before it reaches the controller                       | —                                     |
| Controller | Read `req`, call one service method, send a response                          | Talk to the database, know about JWTs |
| Service    | Hash passwords, issue/verify tokens, enforce account rules, emit audit events | Know about `req`/`res`                |
| Repository | Run Drizzle queries                                                           | Throw HTTP errors, know about JWTs    |

This separation is why, for example, adding audit logging didn't touch the controller or routes at
all — it's a service-layer concern.

## Request flows

Public endpoints (register, login, refresh) are rate-limited **before** validation — rejecting
abusive traffic is cheaper than validating it first:

```mermaid
flowchart LR
    Client --> Route --> RateLimit["Rate Limiter<br/>(per-IP)"] --> Validate["Zod Validation"] --> Controller --> Service --> Repository --> DB[(PostgreSQL)]
```

`/me` is authenticated **before** it's rate-limited, because the limiter keys by user ID and
`req.user` doesn't exist until `authenticate` has run:

```mermaid
flowchart LR
    Client --> Route --> Auth["authenticate"] --> RateLimit["Rate Limiter<br/>(per-user)"] --> Controller --> Service --> Repository --> DB[(PostgreSQL)]
```

`/logout` is authenticated only — no rate limiter, no request body to validate:

```mermaid
flowchart LR
    Client --> Route --> Auth["authenticate"] --> Controller --> Service --> Repository --> DB[(PostgreSQL)]
```

## Why two tokens?

A single long-lived token is convenient but dangerous: if it leaks, it's valid until it expires —
which, for a token you don't want users re-entering their password to renew every few minutes,
would have to be days or weeks.

Splitting into two solves this:

- **Access token** — short-lived (minutes), sent on every request, proves identity. If it leaks,
  the exposure window is small.
- **Refresh token** — longer-lived (days), used _only_ to obtain a new access token, never sent on
  ordinary requests. Smaller attack surface because it's used rarely.

```mermaid
sequenceDiagram
    participant U as Client
    participant S as Auth Service

    U->>S: login (email + password)
    S-->>U: access token (short-lived) + refresh token (long-lived)
    Note over U: access token used on every request until it expires
    U->>S: refresh (old refresh token)
    S->>S: verify signature, expiry, type, issuer, audience
    S->>S: check token's version against user's current version
    S-->>U: brand new access token + brand new refresh token
    Note over U,S: old refresh token is never reused by a well-behaved client
```

Both tokens are structurally identical JWTs signed with the same secret — they're told apart by a
`type` claim (`access` vs `refresh`), which every verification path checks explicitly. This is why
a stolen access token can never be replayed against `/refresh`, and vice versa.

## JWT lifecycle

```mermaid
flowchart TD
    Sign["jwt.sign()<br/>algorithm: HS256<br/>issuer + audience set"] --> Token["Token handed to client"]
    Token --> Verify["jwt.verify()<br/>algorithm allow-list checked<br/>issuer + audience checked<br/>expiry checked"]
    Verify -->|invalid at any check| Reject["Generic 401 - no detail on which check failed"]
    Verify -->|valid| Lookup["Load user by token subject"]
    Lookup --> VersionCheck{"token.version == user.jwt_version?"}
    VersionCheck -->|no| Reject
    VersionCheck -->|yes| Active{"account active?"}
    Active -->|no| RejectInactive["403 account inactive"]
    Active -->|yes| Allow["Request proceeds as this user"]
```

The version check is what makes logout instant and global — see
[JWT versioning, in the module README](../../src/modules/auth/README.md#jwt-versioning) for the
implementation, and [`security.md`](security.md#jwt-versioning) for why this approach was chosen
over a token blacklist.

## Rate limiting architecture

Rate limiting is built as generic, reusable infrastructure — not something specific to auth — so
future modules don't reinvent it:

```mermaid
flowchart TD
    subgraph shared["src/lib/rate-limit/ (shared)"]
        Factory["createRateLimiter()<br/>createUserRateLimiter()"]
        Store["Store factory<br/>in-memory today, Redis-ready"]
    end

    subgraph cfg["config/rate-limit.config.ts"]
        RLConfig["Env-driven windows & limits"]
    end

    subgraph authmod["src/modules/auth/"]
        AuthLimiters["auth.rate-limit.ts<br/>register / login / refresh / me limiters"]
    end

    subgraph futuremod["future modules"]
        OtherLimiters["e.g. projects.rate-limit.ts"]
    end

    Store --> Factory
    RLConfig --> AuthLimiters
    Factory --> AuthLimiters
    Factory --> OtherLimiters
```

Every limiter logs a `warn`-level event (limiter name, IP, path) when it trips, and every limiter
is disabled under `NODE_ENV=test` so integration tests aren't throttled by shared time windows.

## Audit event flow

```mermaid
flowchart LR
    Service["auth.service.ts<br/>(the only caller)"] -->|"auditService.log(event)"| Interface["AuditLogger interface"]
    Interface --> Pino["PinoAuditLogger (today)<br/>structured log line"]
    Interface -. "future swap, no call-site change" .-> Queue["Queue-backed AuditLogger"]
    Queue -.-> BullMQ["BullMQ / Redis"]
    BullMQ -.-> Workers["Background workers<br/>(email alerts, SIEM export, ...)"]
```

The service only ever depends on the `AuditLogger` interface, never the concrete Pino
implementation — which is what makes the "future swap" possible without touching
`auth.service.ts`. See [`roadmap.md`](roadmap.md#planned-features) (background workers / BullMQ row).

## See also

- [`overview.md`](overview.md) — why this system exists, in plain language
- [`security.md`](security.md) — each security control and why it exists
- [`roadmap.md`](roadmap.md) — what's planned and how this design accommodates it
- [`src/modules/auth/README.md`](../../src/modules/auth/README.md) — file-by-file implementation reference
