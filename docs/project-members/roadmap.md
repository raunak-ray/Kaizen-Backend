# Project Members — Roadmap

**Audience:** people scoping the next collaboration feature. None of the items below is
implemented; they describe compatible extension points rather than commitments.

## Planned features

| Feature                         | What it adds                                     | Natural extension point                                                      |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Invitation acceptance           | A pending state before membership becomes active | Replace direct create with invitation persistence and an accept operation    |
| Email invitations               | Invite an address before an account exists       | Invitation record plus mail delivery; membership remains the accepted result |
| Role-based authorization        | Admin/member/viewer permissions                  | Policy checks in the service, using the persisted role values                |
| Custom roles                    | Per-project permission sets                      | Role/permission tables linked to `project_id`                                |
| Organization-aware membership   | Organization-level member management             | Organization module and a scoped membership relationship                     |
| Team memberships                | Add/remove groups rather than one user at a time | Team-to-project join table; preserve individual membership rules             |
| Membership audit history        | Durable "who changed what" record                | Shared audit abstraction or event persistence from service operations        |
| Member-aware project visibility | Members can discover and read private projects   | Extend Projects' accessible-project query with the membership relation       |

## What should remain stable

- **Module boundary:** Projects continues to own lifecycle and metadata; Project Members owns
  membership state and role rules.
- **Layering:** new behavior belongs in the service, not controllers or repositories.
- **Response/error conventions:** use shared response helpers and `AppError` so clients keep one
  envelope and error vocabulary.
- **Role scope:** roles remain scoped to one project. Avoid introducing global user roles here.
- **Database uniqueness:** retain one membership per `(project_id, user_id)`, even if invitations
  or teams introduce additional tables.

## Explicit current limitations

Being listed as a member does not yet grant access to private project metadata through the Projects
module, and `admin`, `member`, and `viewer` roles do not yet confer distinct permissions. Both are
deliberate follow-up work; this module stores the relationship and roles needed to implement them
without changing the API shape later.

## See also

- [`overview.md`](overview.md)
- [`architecture.md`](architecture.md)
- [`security.md`](security.md)
- [`src/modules/project-members/README.md`](../../src/modules/project-members/README.md)
