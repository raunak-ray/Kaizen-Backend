# Projects — Architecture

**Audience:** developers and contributors who want to understand how the system fits together
before reading code. Read [`overview.md`](overview.md) first if you haven't — this document
assumes you already know _why_ the system works this way and focuses on _how_.

## Layered design

The module follows the same layering as [Auth](../auth/architecture.md):

```mermaid
flowchart TD
    Route[Route] --> MW["authenticate<br/>(from the Auth module)"]
    MW --> Val["Validation<br/>Zod schema"]
    Val --> Ctrl["Controller<br/>thin, no business logic"]
    Ctrl --> Svc["Service<br/>all business rules live here"]
    Svc --> Repo["Repository<br/>database queries only"]
    Repo --> DB[(PostgreSQL)]
```

Each layer has exactly one job:

| Layer      | Job                                                                                       | Must NOT do                                   |
| ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| Route      | Wire `authenticate` + Zod schema + controller together                                    | Contain logic                                 |
| Middleware | Authenticate the request (imported from Auth — this module owns no middleware of its own) | Touch business rules                          |
| Validation | Reject malformed input before it reaches the controller                                   | —                                             |
| Controller | Read `req`, call one service method, send a response                                      | Talk to the database, know about ownership    |
| Service    | Generate keys, enforce ownership/visibility/archive rules, log operations, map responses  | Know about `req`/`res`                        |
| Repository | Run Drizzle queries against `tbl_project`                                                 | Throw HTTP errors, know about ownership rules |

This is why, for example, the archived-project check lives entirely in `project.service.ts` and
never touches the controller, routes, or repository.

## Request flow

Every route is authenticated first, then validated, then handled — there's no rate limiting or
audit queue on this module today (see [`roadmap.md`](roadmap.md)):

```mermaid
flowchart LR
    Client --> Route --> Auth["authenticate"] --> Validate["Zod Validation"] --> Controller --> Service --> Repository --> DB[(PostgreSQL)]
```

## Create flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Project Service
    participant R as Project Repository
    participant DB as PostgreSQL

    C->>S: create({ name, description?, visibility? }, ownerId)
    S->>S: generateProjectKey(name) → base key
    S->>R: existsByKey(base)
    R->>DB: SELECT ... WHERE key = base
    alt key taken
        S->>R: existsByKey(base + suffix), suffix = 1, 2, 3...
        R->>DB: SELECT ... WHERE key = candidate
    end
    S->>R: create({ key, name, description, ownerId, visibility })
    R->>DB: INSERT INTO tbl_project ...
    S->>S: log "Project created" (info)
    S-->>C: ProjectResponse
```

Key generation and uniqueness are entirely the service's responsibility — the repository only
answers "does this exact key exist?" (`existsByKey`), it has no opinion on how keys are built.

## Read flow (`findById`)

```mermaid
flowchart TD
    Start["findById(id, userId)"] --> Load["Repository: findById(id)"]
    Load --> Exists{"Found?"}
    Exists -- no --> NotFound["log warn + throw 404 PROJECT_NOT_FOUND"]
    Exists -- yes --> Priv{"visibility === private?"}
    Priv -- no --> Return["Return project"]
    Priv -- yes --> Owner{"owner_id === userId?"}
    Owner -- yes --> Return
    Owner -- no --> Blocked["log warn + throw 404 PROJECT_NOT_FOUND"]
```

Both failure branches return the identical `404 PROJECT_NOT_FOUND` — see
[`security.md`](security.md#private-projects-return-404-not-403) for why "doesn't exist" and "exists
but you can't see it" are deliberately indistinguishable from the outside, even though they're
logged differently on the inside.

## Update / archive / delete flow

All three mutating operations share the same ownership gate before doing anything else:

```mermaid
flowchart TD
    Start["update / archive / remove(id, userId)"] --> Load["Repository: findById(id)"]
    Load --> Exists{"Found?"}
    Exists -- no --> NotFound["log warn + throw 404"]
    Exists -- yes --> Owner{"owner_id === userId?"}
    Owner -- no --> Forbidden["log warn + throw 403 FORBIDDEN"]
    Owner -- yes --> Op{"which operation?"}
    Op -- update --> Archived{"is_archived?"}
    Archived -- yes --> Blocked["log warn + throw 409 PROJECT_ARCHIVED"]
    Archived -- no --> Apply["Apply change"]
    Op -- archive --> Apply2["Set is_archived = true"]
    Op -- remove --> Delete["Delete row"]
    Apply --> Success["log info + return"]
    Apply2 --> Success
    Delete --> Success
```

Note the archived check only exists on the `update` path — archiving and deleting an already
archived project are both still allowed (see [Common Pitfalls in the module README](../../src/modules/projects/README.md#common-pitfalls)).

## Logging architecture

Unlike Auth's queue-ready `AuditLogger` abstraction (built for security-incident review), Projects
uses the shared Pino `logger` directly — this module's logging goal is **operational visibility**
("what happened to this project, and when"), not a security audit trail:

```mermaid
flowchart LR
    Svc["project.service.ts"] -->|"logger.info(...)"| Pino["Shared Pino logger<br/>(config/logger.ts)"]
    Svc -->|"logger.warn(...)"| Pino
    Svc -->|"logger.debug(...)"| Pino
    Pino --> Stdout["stdout<br/>(pretty in dev, JSON in prod)"]
```

| Level   | When                                                            |
| ------- | --------------------------------------------------------------- |
| `info`  | A mutation succeeded: created, updated, archived, deleted       |
| `warn`  | A request was rejected: not found, forbidden, archived-conflict |
| `debug` | A read succeeded, or a key collision was resolved               |

All log lines include structured context (`projectId`, `userId`/`ownerId`, `operation`) so they're
greppable — see [`security.md`](security.md#operational-logging) for the reasoning and what's
deliberately excluded from them.

## See also

- [`overview.md`](overview.md) — why this system exists, in plain language
- [`security.md`](security.md) — each control and why it exists
- [`roadmap.md`](roadmap.md) — what's planned and how this design accommodates it
- [`src/modules/projects/README.md`](../../src/modules/projects/README.md) — file-by-file implementation reference
