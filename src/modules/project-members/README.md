# Project Members

This module manages project-scoped memberships: inviting users, listing members, changing a member role, and removing members. Project creation and project metadata remain in the Projects module.

## Structure

```text
project-members/
├── project-member.controller.ts  # HTTP input/output only
├── project-member.service.ts     # membership and owner rules
├── project-member.repository.ts  # database access only
├── project-member.routes.ts      # authenticated routes and Zod middleware
├── project-member.schema.ts      # request validation
├── project-member.types.ts
├── project-member.constants.ts
└── project-member.swagger.ts
```

## Architecture

Controllers use the shared async handler and response helper. Services enforce all business rules and repositories only persist or retrieve data. Every endpoint requires authentication. Member-management operations require the `owner_id` of the related project; listing verifies the project exists.

## Membership lifecycle

An owner invites an existing user (default role: `member`). Duplicate memberships are rejected by the service and database unique constraint. The owner can later update or remove that membership. Memberships with the `owner` role are protected from role changes and removal.

## Role model

Supported roles are `owner`, `admin`, `member`, and `viewer`. Currently, only the project owner has management permissions; the other roles are retained for future authorization work.

## API

All routes use bearer authentication and are mounted under `/projects/:projectId/members`.

| Method | Path         | Description                       |
| ------ | ------------ | --------------------------------- |
| POST   | `/`          | Invite a user. Owner only.        |
| GET    | `/`          | List project members.             |
| PATCH  | `/:memberId` | Change a member role. Owner only. |
| DELETE | `/:memberId` | Remove a member. Owner only.      |

Request validation covers UUID path parameters, `userId`, and the role allow-list. Swagger documents the request and response schemas.

## Extension points

Invitation acceptance, pending invitations, email delivery, organization membership, audit history, and fine-grained permissions can be added here without changing the controller/repository boundaries.
