import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { inArray, like } from "drizzle-orm";
import { db } from "@db/client";
import { IssueLabel, Project, ProjectMember, User } from "@db/schema";
import { createApp } from "@/app";

const app = createApp();
const TEST_EMAIL_PATTERN = "label-test-%@example.com";
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
      await db.delete(IssueLabel).where(inArray(IssueLabel.project_id, projectIds));
      await db.delete(ProjectMember).where(inArray(ProjectMember.project_id, projectIds));
      await db.delete(Project).where(inArray(Project.id, projectIds));
    }

    await db.delete(User).where(inArray(User.id, userIds));
  }
}

function uniqueEmail(): string {
  return `label-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
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
    .send({ name: "Label Tracker Project" });
  return { owner, projectId: projectResponse.body.data.id as string };
}

async function inviteMember(projectId: string, ownerToken: string, userId: string): Promise<void> {
  await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ userId });
}

function labelsUrl(projectId: string): string {
  return `/api/projects/${projectId}/labels`;
}

function createLabel(projectId: string, accessToken: string, body: Record<string, unknown> = {}) {
  return request(app)
    .post(labelsUrl(projectId))
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name: "Bug", color: "#E11D48", ...body });
}

describe("Issue Label module", () => {
  beforeEach(cleanupTestData);
  afterAll(cleanupTestData);

  describe("POST /api/projects/:projectId/labels", () => {
    it("creates a label for the project owner", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createLabel(projectId, owner.accessToken, {
        description: "Something isn't working",
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        projectId,
        name: "Bug",
        color: "#E11D48",
        description: "Something isn't working",
        archived: false,
      });
    });

    it("creates a label with no description", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createLabel(projectId, owner.accessToken);

      expect(response.status).toBe(201);
      expect(response.body.data.description).toBeNull();
    });

    it("rejects a duplicate label name in the same project", async () => {
      const { owner, projectId } = await setupProject();
      await createLabel(projectId, owner.accessToken);

      const response = await createLabel(projectId, owner.accessToken);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("LABEL_ALREADY_EXISTS");
    });

    it("rejects creation in a nonexistent project", async () => {
      const { accessToken } = await registerUser();

      const response = await createLabel(NIL_UUID, accessToken);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    });

    it("rejects creation from a non-owner project member", async () => {
      const { owner, projectId } = await setupProject();
      const member = await registerUser();
      await inviteMember(projectId, owner.accessToken, member.userId);

      const response = await createLabel(projectId, member.accessToken);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_PROJECT_OWNER");
    });

    it("rejects creation without an access token", async () => {
      const { projectId } = await setupProject();

      const response = await request(app)
        .post(labelsUrl(projectId))
        .send({ name: "No auth", color: "#E11D48" });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects an invalid project id", async () => {
      const { accessToken } = await registerUser();

      const response = await createLabel("not-a-uuid", accessToken);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a name that is too short", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createLabel(projectId, owner.accessToken, { name: "ab" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a color that is not a hex value", async () => {
      const { owner, projectId } = await setupProject();

      const response = await createLabel(projectId, owner.accessToken, { color: "red" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/projects/:projectId/labels", () => {
    it("lists labels for any project member", async () => {
      const { owner, projectId } = await setupProject();
      const member = await registerUser();
      await inviteMember(projectId, owner.accessToken, member.userId);
      await createLabel(projectId, owner.accessToken, { name: "First" });
      await createLabel(projectId, owner.accessToken, { name: "Second" });

      const response = await request(app)
        .get(labelsUrl(projectId))
        .set("Authorization", `Bearer ${member.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it("rejects access from a non-member", async () => {
      const { projectId } = await setupProject();
      const outsider = await registerUser();

      const response = await request(app)
        .get(labelsUrl(projectId))
        .set("Authorization", `Bearer ${outsider.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_A_MEMBER");
    });
  });

  describe("GET /api/projects/:projectId/labels/:labelId", () => {
    it("returns the label for a project member", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .get(`${labelsUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(body.data.id);
    });

    it("returns 404 for a missing label", async () => {
      const { owner, projectId } = await setupProject();

      const response = await request(app)
        .get(`${labelsUrl(projectId)}/${NIL_UUID}`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("LABEL_NOT_FOUND");
    });

    it("rejects an invalid label id", async () => {
      const { owner, projectId } = await setupProject();

      const response = await request(app)
        .get(`${labelsUrl(projectId)}/not-a-uuid`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/projects/:projectId/labels/:labelId", () => {
    it("updates a label's name for the project owner", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ name: "Renamed label" });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Renamed label");
    });

    it("rejects updates from a non-owner project member", async () => {
      const { owner, projectId } = await setupProject();
      const member = await registerUser();
      await inviteMember(projectId, owner.accessToken, member.userId);
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${member.accessToken}`)
        .send({ name: "Renamed label" });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_PROJECT_OWNER");
    });

    it("rejects renaming to a name that already exists in the project", async () => {
      const { owner, projectId } = await setupProject();
      await createLabel(projectId, owner.accessToken, { name: "Taken name" });
      const { body } = await createLabel(projectId, owner.accessToken, {
        name: "Original name",
      });

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ name: "Taken name" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("LABEL_ALREADY_EXISTS");
    });

    it("rejects an update with no fields", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/projects/:projectId/labels/:labelId/archive", () => {
    it("archives a label for the project owner", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.archived).toBe(true);
    });

    it("rejects archiving from a non-owner", async () => {
      const { owner, projectId } = await setupProject();
      const member = await registerUser();
      await inviteMember(projectId, owner.accessToken, member.userId);
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${member.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_PROJECT_OWNER");
    });
  });

  describe("PATCH /api/projects/:projectId/labels/:labelId/restore", () => {
    it("restores an archived label", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createLabel(projectId, owner.accessToken);
      await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/restore`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.archived).toBe(false);
    });

    it("rejects restoring a label that is not archived", async () => {
      const { owner, projectId } = await setupProject();
      const { body } = await createLabel(projectId, owner.accessToken);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/restore`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("LABEL_NOT_ARCHIVED");
    });

    it("rejects restoring from a non-owner", async () => {
      const { owner, projectId } = await setupProject();
      const member = await registerUser();
      await inviteMember(projectId, owner.accessToken, member.userId);
      const { body } = await createLabel(projectId, owner.accessToken);
      await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${owner.accessToken}`);

      const response = await request(app)
        .patch(`${labelsUrl(projectId)}/${body.data.id}/restore`)
        .set("Authorization", `Bearer ${member.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("NOT_PROJECT_OWNER");
    });
  });
});
