import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { inArray, like } from "drizzle-orm";
import { db } from "@db/client";
import { Issue, Project, ProjectMember, User } from "@db/schema";
import { createApp } from "@/app";

const app = createApp();
const TEST_EMAIL_PATTERN = "issue-test-%@example.com";
const password = "StrongPass123";
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

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
      await db.delete(Issue).where(inArray(Issue.project_id, projectIds));
      await db.delete(ProjectMember).where(inArray(ProjectMember.project_id, projectIds));
      await db.delete(Project).where(inArray(Project.id, projectIds));
    }

    await db.delete(User).where(inArray(User.id, userIds));
  }
}

function uniqueEmail(): string {
  return `issue-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
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
    .send({ name: "Issue Tracker Project" });
  return { owner, projectId: projectResponse.body.data.id as string };
}

async function inviteMember(projectId: string, ownerToken: string, userId: string): Promise<void> {
  await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ userId });
}

function issuesUrl(projectId: string): string {
  return `/api/projects/${projectId}/issues`;
}

function createIssue(projectId: string, accessToken: string, body: Record<string, unknown> = {}) {
  return request(app)
    .post(issuesUrl(projectId))
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Fix login redirect loop", ...body });
}

describe("Issues module", () => {
  beforeEach(cleanupTestData);
  afterAll(cleanupTestData);

  describe("POST /api/projects/:projectId/issues", () => {
    it("creates an issue with default status, priority, and type", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createIssue(projectId, owner.accessToken, {
        description: "Users are redirected back to /login after a successful sign in.",
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        projectId,
        reporterId: owner.userId,
        assigneeId: null,
        title: "Fix login redirect loop",
        status: "todo",
        priority: "medium",
        type: "task",
        archived: false,
      });
    });

    it("creates an issue assigned to an existing project member", async () => {
      const { owner, projectId } = await setupProject();
      const assignee = await registerUser();
      await inviteMember(projectId, owner.accessToken, assignee.userId);

      const response = await createIssue(projectId, owner.accessToken, {
        assigneeId: assignee.userId,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.assigneeId).toBe(assignee.userId);
    });

    it("rejects issue creation in a nonexistent project", async () => {
      const { accessToken } = await registerUser();

      const response = await createIssue(NIL_UUID, accessToken);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    });

    it("rejects assigning a nonexistent user", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createIssue(projectId, owner.accessToken, {
        assigneeId: NIL_UUID,
      });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("ASSIGNEE_NOT_FOUND");
    });

    it("rejects assigning a user who is not a project member", async () => {
      const { owner, projectId } = await setupProject();
      const outsider = await registerUser();

      const response = await createIssue(projectId, owner.accessToken, {
        assigneeId: outsider.userId,
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("ASSIGNEE_NOT_A_MEMBER");
    });

    it("rejects requests from a non-member of the project", async () => {
      const { projectId } = await setupProject();
      const outsider = await registerUser();

      const response = await createIssue(projectId, outsider.accessToken);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_A_MEMBER");
    });

    it("rejects a request without an access token", async () => {
      const { projectId } = await setupProject();

      const response = await request(app).post(issuesUrl(projectId)).send({ title: "No auth" });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects an invalid project id", async () => {
      const { accessToken } = await registerUser();

      const response = await createIssue("not-a-uuid", accessToken);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a title that is too short", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createIssue(projectId, owner.accessToken, { title: "ab" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/projects/:projectId/issues/:issueId", () => {
    it("returns the issue for a project member", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .get(`${issuesUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(body.data.id);
    });

    it("returns 404 for a missing issue", async () => {
      const { owner, projectId } = await setupProject();

      const response = await request(app)
        .get(`${issuesUrl(projectId)}/${NIL_UUID}`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("ISSUE_NOT_FOUND");
    });

    it("rejects an invalid issue id", async () => {
      const { owner, projectId } = await setupProject();

      const response = await request(app)
        .get(`${issuesUrl(projectId)}/not-a-uuid`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/projects/:projectId/issues", () => {
    it("lists issues scoped to the project", async () => {
      const { owner, projectId } = await setupProject();
      await createIssue(projectId, owner.accessToken, { title: "First issue" });
      await createIssue(projectId, owner.accessToken, { title: "Second issue" });

      const response = await request(app)
        .get(issuesUrl(projectId))
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.issues).toHaveLength(2);
    });

    it("rejects access from a non-member", async () => {
      const { projectId } = await setupProject();
      const outsider = await registerUser();

      const response = await request(app)
        .get(issuesUrl(projectId))
        .set("Authorization", `Bearer ${outsider.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_A_MEMBER");
    });
  });

  describe("PATCH /api/projects/:projectId/issues/:issueId", () => {
    it("updates an issue's title and description", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ title: "Renamed issue" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Renamed issue");
    });

    it("rejects updates to an archived issue", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ title: "Renamed issue" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ISSUE_ARCHIVED");
    });
  });

  describe("PATCH /api/projects/:projectId/issues/:issueId/assign", () => {
    it("assigns an issue to a project member", async () => {
      const { owner, projectId } = await setupProject();
      const assignee = await registerUser();
      await inviteMember(projectId, owner.accessToken, assignee.userId);
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/assign`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ assigneeId: assignee.userId });

      expect(response.status).toBe(200);
      expect(response.body.data.assigneeId).toBe(assignee.userId);
    });

    it("unassigns an issue when assigneeId is null", async () => {
      const { owner, projectId } = await setupProject();
      const assignee = await registerUser();
      await inviteMember(projectId, owner.accessToken, assignee.userId);
      const { body } = await createIssue(projectId, owner.accessToken, {
        assigneeId: assignee.userId,
      });

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/assign`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ assigneeId: null });

      expect(response.status).toBe(200);
      expect(response.body.data.assigneeId).toBeNull();
    });

    it("rejects assigning a nonexistent user", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/assign`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ assigneeId: NIL_UUID });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("ASSIGNEE_NOT_FOUND");
    });
  });

  describe("PATCH /api/projects/:projectId/issues/:issueId/status", () => {
    it("changes the issue status", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/status`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ status: "in-progress" });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("in-progress");
    });

    it("rejects an invalid status value", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/status`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ status: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/projects/:projectId/issues/:issueId/priority", () => {
    it("changes the issue priority", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/priority`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ priority: "high" });

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe("high");
    });
  });

  describe("PATCH /api/projects/:projectId/issues/:issueId/archive", () => {
    it("archives an issue", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.archived).toBe(true);
    });
  });

  describe("PATCH /api/projects/:projectId/issues/:issueId/restore", () => {
    it("restores an archived issue", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);
      await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/restore`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.archived).toBe(false);
    });

    it("rejects restoring an issue that is not archived", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${issuesUrl(projectId)}/${body.data.id}/restore`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ISSUE_NOT_ARCHIVED");
    });
  });

  describe("DELETE /api/projects/:projectId/issues/:issueId", () => {
    it("soft deletes an issue", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .delete(`${issuesUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app)
        .get(`${issuesUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(getResponse.status).toBe(404);
      expect(getResponse.body.error.code).toBe("ISSUE_NOT_FOUND");
    });

    it("rejects deletion from a non-member", async () => {
      const { owner, projectId } = await setupProject();
      const outsider = await registerUser();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app)
        .delete(`${issuesUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${outsider.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_A_MEMBER");
    });

    it("rejects a request without an access token", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createIssue(projectId, owner.accessToken);

      const response = await request(app).delete(`${issuesUrl(projectId)}/${body.data.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
