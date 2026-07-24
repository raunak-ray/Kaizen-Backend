# Issues — Architecture

**Audience:** developers and contributors who want to understand how the system fits together
before reading code. Read [`overview.md`](overview.md) first if you haven't — this document
assumes you already know _why_ the system works this way and focuses on _how_.

## Layered design

The module follows the same layering as [Projects](../projects/architecture.md) and
[Project Members](../project-members/architecture.md), but is the first module that reaches into
two other domain modules' repositories directly, rather than just Auth's:

```mermaid
flowchart TD
    Route[Route] --> MW["authenticate<br/>(from the Auth module)"]
    MW --> Val["Validation<br/>Zod schema"]
    Val --> Ctrl["Controller<br/>thin, no business logic"]
    Ctrl --> Svc["Issue Service"]
    Svc --> ProjectRepo["Projects repository"]
    Svc --> MemberRepo["Project Members repository"]
    Svc --> UserRepo["Auth repository"]
    Svc --> IssueRepo["Issues repository"]
    ProjectRepo --> DB[(PostgreSQL)]
    MemberRepo --> DB
    UserRepo --> DB
    IssueRepo --> DB
```

| Layer      | Job                                                                                     | Must NOT do                                           |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Route      | Wire `authenticate` + Zod schema + controller together                                  | Contain logic                                         |
| Controller | Read `req`, call one service method, send a response                                    | Talk to the database, know about membership rules     |
| Service    | Validate project/membership/assignee, enforce archived/soft-delete rules, map responses | Know about `req`/`res`                                |
| Repository | Run Drizzle queries against `tbl_issue`, always excluding soft-deleted rows             | Throw HTTP errors, know about membership or archiving |

This is why the archived-issue check, the assignee-membership check, and the "restore requires
archived" rule all live entirely in `issue.service.ts` and never touch the controller, routes, or
repository.

## Request flow

```mermaid
flowchart LR
    Client --> Route --> Auth["authenticate"] --> Validate["Zod Validation"] --> Controller --> Service --> Repository --> DB[(PostgreSQL)]
```

One route — `GET /` (list) — validates `query`, not just `body`/`params`. Building it surfaced a
real Express 5 issue: `req.query` has no setter in this version, so the shared `validate`
middleware originally could not overwrite it with parsed/coerced values (page/limit as numbers,
`archived` as a boolean). The fix merges the parsed result into the existing `req.query` object in
place (`Object.assign`) instead of reassigning it — see `src/lib/validators/validate.ts`. This is
shared infrastructure, so any future module adding query validation benefits from it too.

## Create flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Issue Service
    participant PR as Projects repository
    participant MR as Project Members repository
    participant UR as Auth repository
    participant IR as Issues repository
    participant DB as PostgreSQL

    C->>S: create(projectId, { title, ... assigneeId? }, userId)
    S->>PR: findById(projectId)
    PR->>DB: SELECT ... WHERE id = projectId
    S->>S: is userId the owner, or a member? (MR.exists)
    alt not a member
        S-->>C: 403 NOT_A_MEMBER
    end
    opt assigneeId provided
        S->>UR: findById(assigneeId)
        alt user doesn't exist
            S-->>C: 404 ASSIGNEE_NOT_FOUND
        end
        S->>MR: exists(projectId, assigneeId)
        alt assignee not a member
            S-->>C: 400 ASSIGNEE_NOT_A_MEMBER
        end
    end
    S->>IR: create({ projectId, reporterId: userId, ...defaults })
    IR->>DB: INSERT INTO tbl_issue ...
    S->>S: log "Issue created" (info)
    S-->>C: IssueResponse
```

`validateMembership` is called once and its `ProjectRow` result is threaded into
`validateAssignee`, so a create or assign call never fetches the same project twice.

## Read flow (`findById`, `findAll`)

```mermaid
flowchart TD
    Start["findById(projectId, issueId, userId)"] --> Member["validateMembership"]
    Member -- not a member --> Forbidden["403 NOT_A_MEMBER"]
    Member -- ok --> Load["Repository: findById(projectId, issueId)"]
    Load --> Filter["WHERE project_id = :projectId AND id = :issueId AND deleted_at IS NULL"]
    Filter --> Exists{"Found?"}
    Exists -- no --> NotFound["404 ISSUE_NOT_FOUND"]
    Exists -- yes --> Return["Return issue (even if archived)"]
```

Soft-deleted rows are filtered out at the repository level for every read — the service never sees
them, so a deleted issue and a nonexistent one are indistinguishable from the outside, both
`404 ISSUE_NOT_FOUND`. Archived issues are **not** filtered out here; they remain fully readable,
only their mutation paths are blocked (see below).

`findAll` runs the same membership check, then asks the repository for a filtered, paginated page
(`status`, `priority`, `type`, `assigneeId`, `archived`, `page`, `limit`) plus a total count,
executed as two queries in parallel.

## Update / assign / status / priority flow

```mermaid
flowchart TD
    Start["update / assign / changeStatus / changePriority"] --> Member["validateMembership"]
    Member -- not a member --> Forbidden["403 NOT_A_MEMBER"]
    Member -- ok --> Load["ensureIssueExists"]
    Load -- not found --> NotFound["404 ISSUE_NOT_FOUND"]
    Load -- found --> Active["ensureIssueIsActive"]
    Active -- archived --> Blocked["409 ISSUE_ARCHIVED"]
    Active -- not archived --> Assignee{"assign, with a new assigneeId?"}
    Assignee -- yes --> ValidateAssignee["validateAssignee"]
    Assignee -- no --> Apply["Apply change via repository.update()"]
    ValidateAssignee --> Apply
    Apply --> Success["log info + return mapped issue"]
```

All four operations share this exact shape; they differ only in which fields they pass to
`issueRepository.update()`.

## Archive / restore flow

```mermaid
flowchart TD
    A["archive(projectId, issueId, userId)"] --> AM["validateMembership"] --> AL["ensureIssueExists"] --> AA["Set archived = true"] --> AS["log info + return"]

    R["restore(projectId, issueId, userId)"] --> RM["validateMembership"] --> RL["ensureIssueExists"] --> RC{"Is it currently archived?"}
    RC -- no --> RB["409 ISSUE_NOT_ARCHIVED"]
    RC -- yes --> RA["Set archived = false"] --> RS["log info + return"]
```

Archiving does not call `ensureIssueIsActive` — an already-archived issue can be archived again
without error (idempotent). Restoring is the mirror image: it explicitly requires the issue to
already be archived, so it can't be used as a no-op "activate" on an issue that was never archived.

## Remove flow (soft delete)

```mermaid
flowchart LR
    A["remove(projectId, issueId, userId)"] --> B["validateMembership"] --> C["ensureIssueExists"] --> D["Set deleted_at = now()"] --> E["log info"]
```

There is no `ensureIssueIsActive` check here either — an archived issue can still be deleted. The
repository never physically removes a row; `softDelete` only stamps `deleted_at`, which every read
query then filters on.

## Logging architecture

Like [Projects](../projects/architecture.md#logging-architecture) and unlike Auth's queue-ready
`AuditLogger`, Issues uses the shared Pino `logger` directly for operational visibility:

| Level   | When                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------ |
| `info`  | A mutation succeeded: created, updated, assigned, status/priority changed, archived, restored, deleted |
| `warn`  | A request was rejected: not found, not a member, archived-conflict, assignee invalid                   |
| `debug` | A read succeeded (single issue or list)                                                                |

Every log line includes `projectId`, `issueId` (where applicable), and `userId` so behavior can be
traced from logs alone — see [`security.md`](security.md#operational-logging) for what's
deliberately excluded.

## See also

- [`overview.md`](overview.md) — why this system exists, in plain language
- [`security.md`](security.md) — each control and why it exists
- [`roadmap.md`](roadmap.md) — what's planned and how this design accommodates it
- [`src/modules/issues/README.md`](../../src/modules/issues/README.md) — file-by-file implementation reference
