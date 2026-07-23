import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { inArray, like } from "drizzle-orm";
import { db } from "@db/client";
import { Project, ProjectMember, User } from "@db/schema";
import { createApp } from "@/app";

const app = createApp();
const TEST_EMAIL_PATTERN = "project-member-test-%@example.com";
const password = "StrongPass123";

async function cleanupTestData(): Promise<void> {
  const users = await db
    .select({ id: User.id })
    .from(User)
    .where(like(User.email, TEST_EMAIL_PATTERN));
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    const projects = await db
      .select({ id: Project.id })
      .from(Project)
      .where(inArray(Project.owner_id, userIds));
    const projectIds = projects.map((project) => project.id);
    if (projectIds.length > 0) {
      await db.delete(ProjectMember).where(inArray(ProjectMember.project_id, projectIds));
      await db.delete(Project).where(inArray(Project.id, projectIds));
    }
    await db.delete(User).where(inArray(User.id, userIds));
  }
}

function uniqueEmail(): string {
  return `project-member-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function registerUser() {
  const response = await request(app).post("/api/auth/register").send({
    email: uniqueEmail(),
    password,
    firstName: "Jane",
    lastName: "Doe",
  });
  return {
    accessToken: response.body.data.tokens.accessToken as string,
    userId: response.body.data.user.id as string,
  };
}

async function setupProject() {
  const owner = await registerUser();
  const projectResponse = await request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .send({ name: "Membership Project" });
  return { owner, projectId: projectResponse.body.data.id as string };
}

function membersUrl(projectId: string): string {
  return `/api/projects/${projectId}/members`;
}

describe("Project Members module", () => {
  beforeEach(cleanupTestData);
  afterAll(cleanupTestData);

  it("invites an existing user with the default member role", async () => {
    const { owner, projectId } = await setupProject();
    const invitee = await registerUser();

    const response = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ userId: invitee.userId });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ userId: invitee.userId, role: "member" });
  });

  it("rejects duplicate and nonexistent members", async () => {
    const { owner, projectId } = await setupProject();
    const invitee = await registerUser();
    const agent = request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`);

    await agent.send({ userId: invitee.userId });
    const duplicate = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ userId: invitee.userId });
    const nonexistent = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ userId: "00000000-0000-0000-0000-000000000000" });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("MEMBER_ALREADY_EXISTS");
    expect(nonexistent.status).toBe(404);
    expect(nonexistent.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("returns a conflict when concurrent invitations target the same user", async () => {
    const { owner, projectId } = await setupProject();
    const invitee = await registerUser();

    const [first, second] = await Promise.all([
      request(app)
        .post(membersUrl(projectId))
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ userId: invitee.userId }),
      request(app)
        .post(membersUrl(projectId))
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ userId: invitee.userId }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect([first, second].find((response) => response.status === 409)?.body.error.code).toBe(
      "MEMBER_ALREADY_EXISTS",
    );
  });

  it("lists, updates, and removes project members", async () => {
    const { owner, projectId } = await setupProject();
    const invitee = await registerUser();
    const invite = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ userId: invitee.userId });
    const memberId = invite.body.data.id as string;

    const list = await request(app)
      .get(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`);
    const update = await request(app)
      .patch(`${membersUrl(projectId)}/${memberId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ role: "admin" });
    const remove = await request(app)
      .delete(`${membersUrl(projectId)}/${memberId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`);

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(update.body.data.role).toBe("admin");
    expect(remove.status).toBe(200);
  });

  it("protects owner-role memberships from role changes and removal", async () => {
    const { owner, projectId } = await setupProject();
    const ownerMembership = await db
      .insert(ProjectMember)
      .values({ project_id: projectId, user_id: owner.userId, role: "owner" })
      .returning();
    const memberId = ownerMembership[0].id;

    const update = await request(app)
      .patch(`${membersUrl(projectId)}/${memberId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ role: "admin" });
    const remove = await request(app)
      .delete(`${membersUrl(projectId)}/${memberId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`);

    expect(update.status).toBe(409);
    expect(update.body.error.code).toBe("OWNER_ROLE_CANNOT_BE_CHANGED");
    expect(remove.status).toBe(409);
    expect(remove.body.error.code).toBe("OWNER_CANNOT_BE_REMOVED");
  });

  it("requires authentication and rejects non-owner management", async () => {
    const { owner, projectId } = await setupProject();
    const member = await registerUser();
    const other = await registerUser();
    const invite = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ userId: member.userId });
    const memberId = invite.body.data.id as string;

    const unauthenticated = await request(app)
      .post(membersUrl(projectId))
      .send({ userId: other.userId });
    const nonOwnerInvite = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send({ userId: other.userId });
    const nonOwnerUpdate = await request(app)
      .patch(`${membersUrl(projectId)}/${memberId}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send({ role: "viewer" });
    const nonOwnerRemove = await request(app)
      .delete(`${membersUrl(projectId)}/${memberId}`)
      .set("Authorization", `Bearer ${other.accessToken}`);

    expect(unauthenticated.status).toBe(401);
    expect(nonOwnerInvite.status).toBe(403);
    expect(nonOwnerUpdate.status).toBe(403);
    expect(nonOwnerRemove.status).toBe(403);
  });

  it("validates ids, roles, and required request fields", async () => {
    const { owner, projectId } = await setupProject();

    const invalidId = await request(app)
      .get(membersUrl("not-a-uuid"))
      .set("Authorization", `Bearer ${owner.accessToken}`);
    const invalidRole = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ userId: owner.userId, role: "invalid" });
    const missingUser = await request(app)
      .post(membersUrl(projectId))
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({});

    expect(invalidId.status).toBe(400);
    expect(invalidRole.status).toBe(400);
    expect(missingUser.status).toBe(400);
  });
});
