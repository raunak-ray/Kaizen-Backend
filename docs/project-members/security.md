# Project Members — Security

**Audience:** developers and reviewers assessing project-collaboration access control. This
document describes the current, deliberately small authorization model—not a future permissions
system.

## At a glance

| Control                       | Protection                                                     | Implementation                          |
| ----------------------------- | -------------------------------------------------------------- | --------------------------------------- |
| Authentication on all routes  | Anonymous membership reads or changes                          | `projectMemberRouter.use(authenticate)` |
| Owner-only mutations          | Members or strangers managing another project                  | `validateOwner()` in the service        |
| Zod UUID and role validation  | Invalid identifiers and unsupported roles reaching persistence | Route validation middleware             |
| User/project existence checks | Orphaned or misleading membership actions                      | Service before persistence              |
| Composite unique constraint   | Duplicate project/user memberships, including races            | Database plus service mapping           |
| Owner membership protection   | Removal or role change of an owner record                      | Service rules                           |
| Structured warning logs       | Rejected access and policy actions being invisible             | Shared Pino logger                      |

## Authentication and authorization

Authentication runs before every membership route and resolves the access token into `req.user`.
For invite, update, and remove, `validateOwner()` loads the project and compares its `owner_id` to
that authenticated id. A mismatch returns `403 FORBIDDEN` without relying on any request-supplied
role or user id.

Only project ownership grants management rights today. Stored `admin`, `member`, and `viewer`
roles are **not** permissions yet. This is intentional: pretending they grant authority before the
permission model exists would create an ambiguous and unsafe policy.

## Owner protection

Memberships whose role is `owner` cannot be removed or have their role changed. The service also
checks the authoritative `project.owner_id`, so an owner-associated membership remains protected
even if its stored role is inconsistent. This avoids accidentally allowing a project owner to
delete their own membership record.

## Duplicate invitation safety

The service checks for a current membership before inserting one. That creates the expected,
readable `409 MEMBER_ALREADY_EXISTS` response for normal requests. The database's unique
constraint remains authoritative: if two requests pass that check concurrently, PostgreSQL rejects
one insertion and the service converts its `23505` error into the same `409`, rather than leaking a
generic database failure.

## Operational logging

The module emits structured logs for successful mutations and list reads, and warning logs for
missing projects/users/members, forbidden management attempts, duplicate invitations, and owner
protection decisions. Logs include ids, role, and counts as needed to investigate behavior, but
never email addresses, names, authorization headers, or request bodies.

This is operational logging, not a durable audit-history feature. If compliance or user-visible
history becomes necessary, use the shared audit abstraction rather than persisting ad-hoc logs.

## See also

- [`architecture.md`](architecture.md)
- [`roadmap.md`](roadmap.md)
- [`src/modules/project-members/project-member.service.ts`](../../src/modules/project-members/project-member.service.ts)
